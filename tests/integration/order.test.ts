import { describe, it, expect, vi, beforeEach } from "vitest";

/** Create a mock Prisma Decimal that works with Number() */
function decimal(n: number) {
  return Object.assign(Object.create(null), { valueOf: () => n, toNumber: () => n, toString: () => String(n) });
}

// Mock auth
vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
  requireAdmin: vi.fn(),
}));

// Mock email
vi.mock("@/lib/email", () => ({
  sendOrderConfirmationEmail: vi.fn(() => Promise.resolve()),
  sendShippingUpdateEmail: vi.fn(() => Promise.resolve()),
  sendDeliveryConfirmationEmail: vi.fn(() => Promise.resolve()),
}));

// Mock SSE
vi.mock("@/lib/sse", () => ({
  sendToUser: vi.fn(),
}));

// Mock low stock
vi.mock("@/lib/low-stock", () => ({
  checkLowStock: vi.fn(),
}));

// Mock Prisma db with full order creation support
vi.mock("@/lib/db", () => {
  const mockProducts = [
    {
      id: "p1",
      name: "Product A",
      price: decimal(200000),
      stock: 10,
      isActive: true,
    },
    {
      id: "p2",
      name: "Product B",
      price: decimal(300000),
      stock: 5,
      isActive: true,
    },
    {
      id: "p3",
      name: "Out of Stock",
      price: decimal(100000),
      stock: 0,
      isActive: true,
    },
  ];

  const mockVariants = [
    { id: "v1", productId: "p1", price: decimal(250000), stock: 3 },
  ];

  let orderCounter = 0;

  return {
    db: {
      product: {
        findMany: vi.fn(({ where }: { where: { id: { in: string[] }; isActive: boolean } }) =>
          Promise.resolve(
            mockProducts.filter(
              (p) => where.id.in.includes(p.id) && p.isActive === where.isActive
            )
          )
        ),
        update: vi.fn(() => Promise.resolve()),
      },
      productVariant: {
        findMany: vi.fn(({ where }: { where: { id: { in: string[] } } }) =>
          Promise.resolve(mockVariants.filter((v) => where.id.in.includes(v.id)))
        ),
        update: vi.fn(() => Promise.resolve()),
      },
      discount: {
        findMany: vi.fn(() => Promise.resolve([])),
        update: vi.fn(() => Promise.resolve()),
      },
      order: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(({ data }: { data: Record<string, unknown> }) => {
          orderCounter++;
          const items = (data.items as { create: Array<Record<string, unknown>> })?.create ?? [];
          return Promise.resolve({
            id: `order-${orderCounter}`,
            orderNumber: `ORD-${orderCounter}`,
            userId: data.userId,
            addressId: data.addressId ?? null,
            status: "PENDING",
            subtotal: data.subtotal,
            shippingCost: data.shippingCost,
            tax: data.tax,
            discountId: data.discountId ?? null,
            discountCode: data.discountCode ?? null,
            discountAmount: data.discountAmount,
            total: data.total,
            note: data.note ?? null,
            paymentMethod: data.paymentMethod,
            paymentStatus: data.paymentStatus,
            currency: data.currency,
            paymentExpiry: data.paymentExpiry ?? null,
            items: items.map((item: Record<string, unknown>, idx: number) => ({
              id: `oi-${idx}`,
              ...item,
            })),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }),
        update: vi.fn(({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({
            id: "order-1",
            orderNumber: "ORD-1",
            status: data.status ?? "PENDING",
            subtotal: 200000,
            shippingCost: 30000,
            tax: 16000,
            discountAmount: 0,
            total: 246000,
          })
        ),
      },
      notification: {
        create: vi.fn(({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({
            id: "notif-1",
            ...data,
            createdAt: new Date(),
          })
        ),
      },
      user: {
        findUnique: vi.fn(() =>
          Promise.resolve({ id: "user-1", email: "test@example.com" })
        ),
      },
      address: {
        findUnique: vi.fn(() => Promise.resolve(null)),
      },
      cartItem: {
        deleteMany: vi.fn(() => Promise.resolve({ count: 0 })),
      },
      $transaction: vi.fn(async (fnOrOps: unknown) => {
        if (typeof fnOrOps === "function") {
          // Interactive transaction: pass a mock tx with same methods
          const { db } = await import("@/lib/db");
          return (fnOrOps as (tx: typeof db) => Promise<unknown>)(db);
        }
        return Promise.all(fnOrOps as Array<Promise<unknown>>);
      }),
    },
  };
});

describe("Order Creation", () => {
  let getSession: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const authModule = await import("@/lib/auth");
    getSession = vi.mocked(authModule.getSession);
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    getSession.mockResolvedValue(null);

    const { createOrder } = await import("@/actions/order");
    const result = await createOrder([{ id: "p1", quantity: 1 }]);
    expect(result.success).toBe(false);
    expect(result.error).toContain("sign in");
  });

  it("validates items schema - empty items", async () => {
    getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

    const { createOrder } = await import("@/actions/order");
    const result = await createOrder([]);
    expect(result.success).toBe(false);
  });

  it("validates items schema - invalid quantity", async () => {
    getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

    const { createOrder } = await import("@/actions/order");
    const result = await createOrder([{ id: "p1", quantity: 0 }]);
    expect(result.success).toBe(false);
  });

  it("creates order with correct price calculation", async () => {
    getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

    const { createOrder } = await import("@/actions/order");
    const result = await createOrder(
      [{ id: "p1", quantity: 2 }], // 200000 * 2 = 400000
      undefined,
      undefined,
      undefined,
      "COD"
    );

    expect(result.success).toBe(true);
    expect(result.order).toBeDefined();
    // Subtotal: 400000 (200000 * 2)
    expect(result.order!.subtotal).toBe(400000);
    // Shipping: 30000 (below 1M threshold)
    expect(result.order!.shippingCost).toBe(30000);
    // Tax: (400000 - 0) * 0.08 = 32000
    expect(result.order!.tax).toBe(32000);
    // Total: 400000 + 30000 + 32000 = 462000
    expect(result.order!.total).toBe(462000);
  });

  it("applies free shipping for orders >= 1M VND", async () => {
    getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

    const dbModule = await import("@/lib/db");
    // Override product to return expensive item
    vi.mocked(dbModule.db.product.findMany).mockResolvedValueOnce([
      {
        id: "p1",
        name: "Expensive",
        price: decimal(600000),
        stock: 10,
        isActive: true,
      },
    ] as never);

    const { createOrder } = await import("@/actions/order");
    const result = await createOrder(
      [{ id: "p1", quantity: 2 }], // 600000 * 2 = 1,200,000
      undefined,
      undefined,
      undefined,
      "COD"
    );

    expect(result.success).toBe(true);
    expect(result.order!.shippingCost).toBe(0);
  });

  it("rejects order with insufficient stock", async () => {
    getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

    const { createOrder } = await import("@/actions/order");
    const result = await createOrder(
      [{ id: "p3", quantity: 1 }], // stock is 0
      undefined,
      undefined,
      undefined,
      "COD"
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Insufficient stock");
  });

  it("rejects order for unavailable products", async () => {
    getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

    const dbModule = await import("@/lib/db");
    vi.mocked(dbModule.db.product.findMany).mockResolvedValueOnce([] as never);

    const { createOrder } = await import("@/actions/order");
    const result = await createOrder([{ id: "nonexistent", quantity: 1 }]);
    expect(result.success).toBe(false);
    expect(result.error).toContain("no longer available");
  });

  it("uses variant price when variantId is provided", async () => {
    getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

    const { createOrder } = await import("@/actions/order");
    const result = await createOrder(
      [{ id: "p1", quantity: 1, variantId: "v1" }], // variant price: 250000
      undefined,
      undefined,
      undefined,
      "COD"
    );

    expect(result.success).toBe(true);
    expect(result.order!.subtotal).toBe(250000);
  });

  it("rejects order with non-existent variant", async () => {
    getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

    const dbModule = await import("@/lib/db");
    vi.mocked(dbModule.db.productVariant.findMany).mockResolvedValueOnce([] as never);

    const { createOrder } = await import("@/actions/order");
    const result = await createOrder(
      [{ id: "p1", quantity: 1, variantId: "nonexistent" }]
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Variant not found");
  });

  it("rejects order with variant insufficient stock", async () => {
    getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

    const { createOrder } = await import("@/actions/order");
    const result = await createOrder(
      [{ id: "p1", quantity: 10, variantId: "v1" }] // variant stock is 3
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Insufficient stock");
  });

  it("sets payment expiry for non-COD methods", async () => {
    getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

    const { createOrder } = await import("@/actions/order");
    const result = await createOrder(
      [{ id: "p1", quantity: 1 }],
      undefined,
      undefined,
      undefined,
      "STRIPE"
    );

    expect(result.success).toBe(true);
    expect(result.order!.paymentExpiry).not.toBeNull();
  });

  it("does not set payment expiry for COD", async () => {
    getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

    const { createOrder } = await import("@/actions/order");
    const result = await createOrder(
      [{ id: "p1", quantity: 1 }],
      undefined,
      undefined,
      undefined,
      "COD"
    );

    expect(result.success).toBe(true);
    expect(result.order!.paymentExpiry).toBeNull();
  });

  it("decrements stock in transaction", async () => {
    getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

    const dbModule = await import("@/lib/db");

    const { createOrder } = await import("@/actions/order");
    await createOrder([{ id: "p1", quantity: 2 }]);

    expect(dbModule.db.product.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { stock: { decrement: 2 } },
    });
  });

  it("applies percentage discount code on order", async () => {
    getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

    const dbModule = await import("@/lib/db");
    const now = new Date();
    vi.mocked(dbModule.db.discount.findMany).mockResolvedValueOnce([
      {
        id: "d1",
        code: "SAVE10",
        type: "PERCENTAGE",
        scope: "ORDER",
        value: decimal(10),
        isActive: true,
        stackable: false,
        startsAt: new Date(now.getTime() - 86400000),
        expiresAt: new Date(now.getTime() + 86400000),
        maxUses: 100,
        usedCount: 0,
        minOrder: decimal(0),
        products: [],
      },
    ] as never);

    const { createOrder } = await import("@/actions/order");
    const result = await createOrder(
      [{ id: "p1", quantity: 2 }], // subtotal: 400000
      undefined,
      undefined,
      "SAVE10",
      "COD"
    );

    expect(result.success).toBe(true);
    // 10% of 400000 = 40000
    expect(result.order!.discountAmount).toBe(40000);
    expect(result.order!.discountCode).toBe("SAVE10");
  });

  it("applies fixed discount code capped at subtotal", async () => {
    getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

    const dbModule = await import("@/lib/db");
    const now = new Date();
    vi.mocked(dbModule.db.discount.findMany).mockResolvedValueOnce([
      {
        id: "d2",
        code: "FLAT500K",
        type: "FIXED",
        scope: "ORDER",
        value: decimal(500000),
        isActive: true,
        stackable: false,
        startsAt: new Date(now.getTime() - 86400000),
        expiresAt: null,
        maxUses: null,
        usedCount: 0,
        minOrder: null,
        products: [],
      },
    ] as never);

    const { createOrder } = await import("@/actions/order");
    const result = await createOrder(
      [{ id: "p1", quantity: 2 }], // subtotal: 400000
      undefined,
      undefined,
      "FLAT500K",
      "COD"
    );

    expect(result.success).toBe(true);
    // Fixed 500000 capped at subtotal 400000
    expect(result.order!.discountAmount).toBe(400000);
  });

  it("applies product-scoped percentage discount", async () => {
    getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

    const dbModule = await import("@/lib/db");
    const now = new Date();
    vi.mocked(dbModule.db.discount.findMany).mockResolvedValueOnce([
      {
        id: "d3",
        code: "PROD20",
        type: "PERCENTAGE",
        scope: "PRODUCT",
        value: decimal(20),
        isActive: true,
        stackable: false,
        startsAt: new Date(now.getTime() - 86400000),
        expiresAt: null,
        maxUses: null,
        usedCount: 0,
        minOrder: null,
        products: [{ productId: "p1" }], // only p1 eligible
      },
    ] as never);

    const { createOrder } = await import("@/actions/order");
    const result = await createOrder(
      [
        { id: "p1", quantity: 1 }, // 200000 - eligible
        { id: "p2", quantity: 1 }, // 300000 - not eligible
      ],
      undefined,
      undefined,
      "PROD20",
      "COD"
    );

    expect(result.success).toBe(true);
    // 20% of 200000 (eligible only) = 40000
    expect(result.order!.discountAmount).toBe(40000);
  });

  it("skips inactive discount codes", async () => {
    getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

    const dbModule = await import("@/lib/db");
    vi.mocked(dbModule.db.discount.findMany).mockResolvedValueOnce([
      {
        id: "d4",
        code: "INACTIVE",
        type: "PERCENTAGE",
        scope: "ORDER",
        value: decimal(50),
        isActive: false,
        stackable: false,
        startsAt: new Date(),
        expiresAt: null,
        maxUses: null,
        usedCount: 0,
        minOrder: null,
        products: [],
      },
    ] as never);

    const { createOrder } = await import("@/actions/order");
    const result = await createOrder(
      [{ id: "p1", quantity: 1 }],
      undefined,
      undefined,
      "INACTIVE",
      "COD"
    );

    expect(result.success).toBe(true);
    expect(result.order!.discountAmount).toBe(0);
  });

  it("skips non-stackable discount when multiple codes", async () => {
    getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

    const dbModule = await import("@/lib/db");
    const now = new Date();
    vi.mocked(dbModule.db.discount.findMany).mockResolvedValueOnce([
      {
        id: "d5",
        code: "CODE1",
        type: "PERCENTAGE",
        scope: "ORDER",
        value: decimal(10),
        isActive: true,
        stackable: false, // not stackable
        startsAt: new Date(now.getTime() - 86400000),
        expiresAt: null,
        maxUses: null,
        usedCount: 0,
        minOrder: null,
        products: [],
      },
      {
        id: "d6",
        code: "CODE2",
        type: "PERCENTAGE",
        scope: "ORDER",
        value: decimal(5),
        isActive: true,
        stackable: true,
        startsAt: new Date(now.getTime() - 86400000),
        expiresAt: null,
        maxUses: null,
        usedCount: 0,
        minOrder: null,
        products: [],
      },
    ] as never);

    const { createOrder } = await import("@/actions/order");
    const result = await createOrder(
      [{ id: "p1", quantity: 1 }],
      undefined,
      undefined,
      "CODE1,CODE2",
      "COD"
    );

    expect(result.success).toBe(true);
    // Only stackable CODE2 applies (5% of 200000 = 10000)
    // CODE1 is non-stackable and skipped when multiple discounts
    expect(result.order!.discountAmount).toBe(10000);
  });

  it("skips expired discount", async () => {
    getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

    const dbModule = await import("@/lib/db");
    const now = new Date();
    vi.mocked(dbModule.db.discount.findMany).mockResolvedValueOnce([
      {
        id: "d7",
        code: "EXPIRED",
        type: "PERCENTAGE",
        scope: "ORDER",
        value: decimal(10),
        isActive: true,
        stackable: false,
        startsAt: new Date(now.getTime() - 86400000 * 30),
        expiresAt: new Date(now.getTime() - 86400000), // expired yesterday
        maxUses: null,
        usedCount: 0,
        minOrder: null,
        products: [],
      },
    ] as never);

    const { createOrder } = await import("@/actions/order");
    const result = await createOrder(
      [{ id: "p1", quantity: 1 }],
      undefined,
      undefined,
      "EXPIRED",
      "COD"
    );

    expect(result.success).toBe(true);
    expect(result.order!.discountAmount).toBe(0);
  });

  it("skips discount when max uses reached", async () => {
    getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

    const dbModule = await import("@/lib/db");
    const now = new Date();
    vi.mocked(dbModule.db.discount.findMany).mockResolvedValueOnce([
      {
        id: "d8",
        code: "MAXED",
        type: "FIXED",
        scope: "ORDER",
        value: decimal(50000),
        isActive: true,
        stackable: false,
        startsAt: new Date(now.getTime() - 86400000),
        expiresAt: null,
        maxUses: 10,
        usedCount: 10, // fully used
        minOrder: null,
        products: [],
      },
    ] as never);

    const { createOrder } = await import("@/actions/order");
    const result = await createOrder(
      [{ id: "p1", quantity: 1 }],
      undefined,
      undefined,
      "MAXED",
      "COD"
    );

    expect(result.success).toBe(true);
    expect(result.order!.discountAmount).toBe(0);
  });

  it("skips discount when min order not met", async () => {
    getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

    const dbModule = await import("@/lib/db");
    const now = new Date();
    vi.mocked(dbModule.db.discount.findMany).mockResolvedValueOnce([
      {
        id: "d9",
        code: "MINORDER",
        type: "FIXED",
        scope: "ORDER",
        value: decimal(50000),
        isActive: true,
        stackable: false,
        startsAt: new Date(now.getTime() - 86400000),
        expiresAt: null,
        maxUses: null,
        usedCount: 0,
        minOrder: decimal(1000000), // min 1M VND
        products: [],
      },
    ] as never);

    const { createOrder } = await import("@/actions/order");
    const result = await createOrder(
      [{ id: "p1", quantity: 1 }], // subtotal: 200000 < 1M
      undefined,
      undefined,
      "MINORDER",
      "COD"
    );

    expect(result.success).toBe(true);
    expect(result.order!.discountAmount).toBe(0);
  });

  it("saves order note", async () => {
    getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

    const { createOrder } = await import("@/actions/order");
    const result = await createOrder(
      [{ id: "p1", quantity: 1 }],
      undefined,
      "Please deliver before 5pm",
      undefined,
      "COD"
    );

    expect(result.success).toBe(true);
    expect(result.order!.note).toBe("Please deliver before 5pm");
  });
});

describe("Cancel Order", () => {
  let getSession: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const authModule = await import("@/lib/auth");
    getSession = vi.mocked(authModule.getSession);
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    getSession.mockResolvedValue(null);

    const { cancelOrder } = await import("@/actions/order");
    const result = await cancelOrder("order-1");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
  });

  it("rejects cancellation of non-owned order", async () => {
    getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

    const dbModule = await import("@/lib/db");
    vi.mocked(dbModule.db.order.findFirst).mockResolvedValue(null);

    const { cancelOrder } = await import("@/actions/order");
    const result = await cancelOrder("order-999");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Order not found");
  });

  it("rejects cancellation of shipped order", async () => {
    getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

    const dbModule = await import("@/lib/db");
    vi.mocked(dbModule.db.order.findFirst).mockResolvedValue({
      id: "order-1",
      userId: "user-1",
      status: "SHIPPED",
      items: [],
    } as never);

    const { cancelOrder } = await import("@/actions/order");
    const result = await cancelOrder("order-1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("cannot be cancelled");
  });

  it("allows cancellation of PENDING order", async () => {
    getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

    const dbModule = await import("@/lib/db");
    vi.mocked(dbModule.db.order.findFirst).mockResolvedValue({
      id: "order-1",
      userId: "user-1",
      status: "PENDING",
      items: [
        { productId: "p1", variantId: null, quantity: 2 },
      ],
    } as never);

    const { cancelOrder } = await import("@/actions/order");
    const result = await cancelOrder("order-1");
    expect(result.success).toBe(true);
  });

  it("restores stock on cancellation", async () => {
    getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

    const dbModule = await import("@/lib/db");
    vi.mocked(dbModule.db.order.findFirst).mockResolvedValue({
      id: "order-1",
      userId: "user-1",
      status: "CONFIRMED",
      items: [
        { productId: "p1", variantId: null, quantity: 3 },
        { productId: "p2", variantId: "v1", quantity: 1 },
      ],
    } as never);

    const { cancelOrder } = await import("@/actions/order");
    await cancelOrder("order-1");

    // Should restore product stock
    expect(dbModule.db.product.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { stock: { increment: 3 } },
    });

    // Should restore variant stock
    expect(dbModule.db.productVariant.update).toHaveBeenCalledWith({
      where: { id: "v1" },
      data: { stock: { increment: 1 } },
    });
  });
});

describe("Update Order Status", () => {
  let requireAdmin: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const authModule = await import("@/lib/auth");
    requireAdmin = vi.mocked(authModule.requireAdmin);
    vi.clearAllMocks();
  });

  it("requires admin", async () => {
    requireAdmin.mockRejectedValue(new Error("Forbidden"));

    const { updateOrderStatus } = await import("@/actions/order");
    await expect(updateOrderStatus("order-1", "SHIPPED")).rejects.toThrow("Forbidden");
  });

  it("rejects invalid status", async () => {
    requireAdmin.mockResolvedValue({
      id: "admin-1",
      role: "ADMIN",
      email: "admin@test.com",
      name: "Admin",
    });

    const { updateOrderStatus } = await import("@/actions/order");
    const result = await updateOrderStatus("order-1", "INVALID_STATUS");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid order status");
  });

  it("updates status successfully", async () => {
    requireAdmin.mockResolvedValue({
      id: "admin-1",
      role: "ADMIN",
      email: "admin@test.com",
      name: "Admin",
    });

    const dbModule = await import("@/lib/db");
    vi.mocked(dbModule.db.order.findUnique).mockResolvedValue({
      id: "order-1",
      orderNumber: "ORD-123",
      userId: "user-1",
    } as never);

    const { updateOrderStatus } = await import("@/actions/order");
    const result = await updateOrderStatus("order-1", "PROCESSING");
    expect(result.success).toBe(true);
  });

  it("returns error for non-existent order", async () => {
    requireAdmin.mockResolvedValue({
      id: "admin-1",
      role: "ADMIN",
      email: "admin@test.com",
      name: "Admin",
    });

    const dbModule = await import("@/lib/db");
    vi.mocked(dbModule.db.order.findUnique).mockResolvedValue(null);

    const { updateOrderStatus } = await import("@/actions/order");
    const result = await updateOrderStatus("nonexistent", "SHIPPED");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Order not found");
  });
});
