import { describe, it, expect, vi, beforeEach } from "vitest";

/** Create a mock Prisma Decimal that works with Number() */
function decimal(n: number) {
  return Object.assign(Object.create(null), { valueOf: () => n, toNumber: () => n, toString: () => String(n) });
}

// Mock auth to return a userId
vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

// Mock Prisma db
vi.mock("@/lib/db", () => {
  const mockCartItems: Array<{
    id: string;
    userId: string;
    productId: string;
    variantId: string | null;
    quantity: number;
    product?: Record<string, unknown>;
    variant?: Record<string, unknown> | null;
  }> = [];

  return {
    db: {
      cartItem: {
        findMany: vi.fn(({ where }: { where: { userId: string } }) =>
          Promise.resolve(mockCartItems.filter((i) => i.userId === where.userId))
        ),
        findFirst: vi.fn(
          ({
            where,
          }: {
            where: { userId: string; productId: string; variantId: string | null };
          }) =>
            Promise.resolve(
              mockCartItems.find(
                (i) =>
                  i.userId === where.userId &&
                  i.productId === where.productId &&
                  i.variantId === (where.variantId ?? null)
              ) || null
            )
        ),
        create: vi.fn(({ data }: { data: Record<string, unknown> }) => {
          const item = { id: `cart-${Date.now()}`, ...data };
          mockCartItems.push(item as never);
          return Promise.resolve(item);
        }),
        createMany: vi.fn(({ data }: { data: Array<Record<string, unknown>> }) => {
          for (const d of data) {
            mockCartItems.push({ id: `cart-${Date.now()}-${Math.random()}`, ...d } as never);
          }
          return Promise.resolve({ count: data.length });
        }),
        update: vi.fn(
          ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
            const idx = mockCartItems.findIndex((i) => i.id === where.id);
            if (idx >= 0) {
              Object.assign(mockCartItems[idx], data);
            }
            return Promise.resolve(mockCartItems[idx]);
          }
        ),
        deleteMany: vi.fn(
          ({
            where,
          }: {
            where: {
              userId: string;
              productId?: string;
              variantId?: string | null;
            };
          }) => {
            const before = mockCartItems.length;
            const toRemove = mockCartItems.filter((i) => {
              if (i.userId !== where.userId) return false;
              if (where.productId && i.productId !== where.productId) return false;
              if ("variantId" in where && i.variantId !== (where.variantId ?? null))
                return false;
              return true;
            });
            for (const item of toRemove) {
              const idx = mockCartItems.indexOf(item);
              if (idx >= 0) mockCartItems.splice(idx, 1);
            }
            return Promise.resolve({ count: before - mockCartItems.length });
          }
        ),
      },
      $transaction: vi.fn((ops: Array<Promise<unknown>>) => Promise.all(ops)),
      _mockCartItems: mockCartItems,
    },
  };
});

describe("Cart DB Server Actions", () => {
  let getSession: ReturnType<typeof vi.fn>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dbModule: any;

  beforeEach(async () => {
    const authModule = await import("@/lib/auth");
    getSession = vi.mocked(authModule.getSession);
    dbModule = await import("@/lib/db");

    // Clear mock cart items
    dbModule.db._mockCartItems.length = 0;

    vi.clearAllMocks();
  });

  describe("syncCartItemToDB", () => {
    it("returns failure when not authenticated", async () => {
      getSession.mockResolvedValue(null);

      const { syncCartItemToDB } = await import("@/actions/cart-db");
      const result = await syncCartItemToDB("prod-1", 2);
      expect(result).toEqual({ success: false });
    });

    it("creates a new cart item", async () => {
      getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });
      dbModule.db.cartItem.findFirst.mockResolvedValue(null);

      const { syncCartItemToDB } = await import("@/actions/cart-db");
      const result = await syncCartItemToDB("prod-1", 2);
      expect(result).toEqual({ success: true });
      expect(dbModule.db.cartItem.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          productId: "prod-1",
          variantId: null,
          quantity: 2,
        },
      });
    });

    it("updates an existing cart item", async () => {
      getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });
      dbModule.db.cartItem.findFirst.mockResolvedValue({
        id: "cart-1",
        userId: "user-1",
        productId: "prod-1",
        variantId: null,
        quantity: 1,
      });

      const { syncCartItemToDB } = await import("@/actions/cart-db");
      const result = await syncCartItemToDB("prod-1", 3);
      expect(result).toEqual({ success: true });
      expect(dbModule.db.cartItem.update).toHaveBeenCalledWith({
        where: { id: "cart-1" },
        data: { quantity: 3 },
      });
    });

    it("deletes item when quantity is 0 or less", async () => {
      getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

      const { syncCartItemToDB } = await import("@/actions/cart-db");
      const result = await syncCartItemToDB("prod-1", 0);
      expect(result).toEqual({ success: true });
      expect(dbModule.db.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-1", productId: "prod-1", variantId: null },
      });
    });

    it("handles variant ID correctly", async () => {
      getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });
      dbModule.db.cartItem.findFirst.mockResolvedValue(null);

      const { syncCartItemToDB } = await import("@/actions/cart-db");
      await syncCartItemToDB("prod-1", 1, "var-1");
      expect(dbModule.db.cartItem.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          productId: "prod-1",
          variantId: "var-1",
          quantity: 1,
        },
      });
    });
  });

  describe("removeCartItemFromDB", () => {
    it("returns failure when not authenticated", async () => {
      getSession.mockResolvedValue(null);

      const { removeCartItemFromDB } = await import("@/actions/cart-db");
      const result = await removeCartItemFromDB("prod-1");
      expect(result).toEqual({ success: false });
    });

    it("deletes the cart item", async () => {
      getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

      const { removeCartItemFromDB } = await import("@/actions/cart-db");
      const result = await removeCartItemFromDB("prod-1");
      expect(result).toEqual({ success: true });
      expect(dbModule.db.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-1", productId: "prod-1", variantId: null },
      });
    });

    it("deletes specific variant item", async () => {
      getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

      const { removeCartItemFromDB } = await import("@/actions/cart-db");
      await removeCartItemFromDB("prod-1", "var-1");
      expect(dbModule.db.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-1", productId: "prod-1", variantId: "var-1" },
      });
    });
  });

  describe("clearCartDB", () => {
    it("returns failure when not authenticated", async () => {
      getSession.mockResolvedValue(null);

      const { clearCartDB } = await import("@/actions/cart-db");
      const result = await clearCartDB();
      expect(result).toEqual({ success: false });
    });

    it("deletes all cart items for user", async () => {
      getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

      const { clearCartDB } = await import("@/actions/cart-db");
      const result = await clearCartDB();
      expect(result).toEqual({ success: true });
      expect(dbModule.db.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
      });
    });
  });

  describe("saveCartToDB", () => {
    it("returns failure when not authenticated", async () => {
      getSession.mockResolvedValue(null);

      const { saveCartToDB } = await import("@/actions/cart-db");
      const result = await saveCartToDB([]);
      expect(result).toEqual({ success: false });
    });

    it("replaces all items with transaction", async () => {
      getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

      const { saveCartToDB } = await import("@/actions/cart-db");
      const items = [
        { productId: "p1", quantity: 2, variantId: null },
        { productId: "p2", quantity: 1, variantId: "v1" },
      ];
      const result = await saveCartToDB(items);
      expect(result).toEqual({ success: true });
      expect(dbModule.db.$transaction).toHaveBeenCalled();
    });

    it("handles empty items (delete only)", async () => {
      getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

      const { saveCartToDB } = await import("@/actions/cart-db");
      const result = await saveCartToDB([]);
      expect(result).toEqual({ success: true });
      expect(dbModule.db.$transaction).toHaveBeenCalled();
    });
  });

  describe("mergeCartsInDB", () => {
    it("returns failure when not authenticated", async () => {
      getSession.mockResolvedValue(null);

      const { mergeCartsInDB } = await import("@/actions/cart-db");
      const result = await mergeCartsInDB([]);
      expect(result).toEqual({ success: false });
    });

    it("merges local items with DB items, summing quantities", async () => {
      getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

      // Existing DB items
      dbModule.db.cartItem.findMany.mockResolvedValue([
        { productId: "p1", variantId: null, quantity: 2 },
        { productId: "p2", variantId: null, quantity: 1 },
      ]);

      const { mergeCartsInDB } = await import("@/actions/cart-db");
      const result = await mergeCartsInDB([
        { productId: "p1", quantity: 3 }, // existing: merge → 2+3=5
        { productId: "p3", quantity: 1 }, // new item
      ]);

      expect(result).toEqual({ success: true });
      expect(dbModule.db.$transaction).toHaveBeenCalled();

      // Verify the transaction was called with delete + createMany
      const txArgs = dbModule.db.$transaction.mock.calls[0][0];
      expect(txArgs).toHaveLength(2); // deleteMany + createMany
    });

    it("handles empty merge (no local items, no DB items)", async () => {
      getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });
      dbModule.db.cartItem.findMany.mockResolvedValue([]);

      const { mergeCartsInDB } = await import("@/actions/cart-db");
      const result = await mergeCartsInDB([]);
      expect(result).toEqual({ success: true });
      // No transaction needed for empty merge
      expect(dbModule.db.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("loadCartFromDB", () => {
    it("returns empty when not authenticated", async () => {
      getSession.mockResolvedValue(null);

      const { loadCartFromDB } = await import("@/actions/cart-db");
      const result = await loadCartFromDB();
      expect(result).toEqual({ success: false, items: [] });
    });

    it("returns enriched cart items", async () => {
      getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

      dbModule.db.cartItem.findMany.mockResolvedValue([
        {
          userId: "user-1",
          productId: "p1",
          variantId: null,
          quantity: 2,
          product: {
            id: "p1",
            name: "Product 1",
            price: decimal(100000),
            images: ["/img1.jpg"],
            stock: 10,
            isActive: true,
          },
          variant: null,
        },
      ]);

      const { loadCartFromDB } = await import("@/actions/cart-db");
      const result = await loadCartFromDB();
      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        id: "p1",
        name: "Product 1",
        price: 100000,
        quantity: 2,
        stock: 10,
      });
    });

    it("filters out inactive products", async () => {
      getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

      dbModule.db.cartItem.findMany.mockResolvedValue([
        {
          userId: "user-1",
          productId: "p1",
          variantId: null,
          quantity: 1,
          product: {
            id: "p1",
            name: "Inactive",
            price: decimal(50000),
            images: [],
            stock: 5,
            isActive: false,
          },
          variant: null,
        },
      ]);

      const { loadCartFromDB } = await import("@/actions/cart-db");
      const result = await loadCartFromDB();
      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(0);
    });

    it("clamps quantity to stock", async () => {
      getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

      dbModule.db.cartItem.findMany.mockResolvedValue([
        {
          userId: "user-1",
          productId: "p1",
          variantId: null,
          quantity: 20, // more than stock
          product: {
            id: "p1",
            name: "Product",
            price: decimal(50000),
            images: ["/img.jpg"],
            stock: 5,
            isActive: true,
          },
          variant: null,
        },
      ]);

      const { loadCartFromDB } = await import("@/actions/cart-db");
      const result = await loadCartFromDB();
      expect(result.items[0].quantity).toBe(5);
    });

    it("uses variant price and stock when variant exists", async () => {
      getSession.mockResolvedValue({ userId: "user-1", role: "CUSTOMER" });

      dbModule.db.cartItem.findMany.mockResolvedValue([
        {
          userId: "user-1",
          productId: "p1",
          variantId: "v1",
          quantity: 1,
          product: {
            id: "p1",
            name: "Product",
            price: decimal(100000),
            images: ["/img.jpg"],
            stock: 10,
            isActive: true,
          },
          variant: {
            id: "v1",
            price: decimal(120000),
            stock: 3,
            options: [
              {
                facetValue: {
                  value: "M",
                  facet: { name: "Size" },
                },
              },
            ],
          },
        },
      ]);

      const { loadCartFromDB } = await import("@/actions/cart-db");
      const result = await loadCartFromDB();
      expect(result.items[0].price).toBe(120000);
      expect(result.items[0].stock).toBe(3);
      expect(result.items[0].variantLabel).toBe("Size: M");
    });
  });
});
