"use server";

import { db } from "@/lib/db";
import { getSession, requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { discountSchema, applyDiscountSchema } from "@/lib/validations/discount";
import { broadcast } from "@/lib/sse";

function serializeDiscount(discount: Record<string, unknown>) {
  return {
    ...discount,
    value: Number(discount.value),
    minOrder: discount.minOrder ? Number(discount.minOrder) : null,
  };
}

export async function createDiscount(data: unknown) {
  await requireAdmin();

  const parsed = discountSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const input = parsed.data;

  const existing = await db.discount.findUnique({
    where: { code: input.code },
  });
  if (existing) {
    return { success: false, error: "A discount with this code already exists" };
  }

  const discount = await db.$transaction(async (tx) => {
    const d = await tx.discount.create({
      data: {
        code: input.code,
        description: input.description || null,
        type: input.type,
        scope: input.scope,
        method: input.method,
        stackable: input.stackable,
        value: input.value,
        minOrder: input.minOrder ?? null,
        maxUses: input.maxUses ?? null,
        isActive: input.isActive,
        startsAt: input.startsAt ? new Date(input.startsAt) : new Date(),
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });

    if (input.scope === "PRODUCT" && input.productIds.length > 0) {
      await tx.discountProduct.createMany({
        data: input.productIds.map((pid) => ({
          discountId: d.id,
          productId: pid,
        })),
      });
    }

    return d;
  });

  // Fetch product names if product-scoped
  let productNames: string[] = [];
  if (input.scope === "PRODUCT" && input.productIds.length > 0) {
    const products = await db.product.findMany({
      where: { id: { in: input.productIds } },
      select: { name: true },
    });
    productNames = products.map((p) => p.name);
  }

  // Build rich notification message
  const valueText =
    discount.type === "PERCENTAGE"
      ? `${Number(discount.value)}% off`
      : `$${Number(discount.value)} off`;

  const scopeText =
    discount.scope === "ORDER"
      ? "your entire order"
      : productNames.length <= 3
        ? productNames.join(", ")
        : `${productNames.length} selected products`;

  const methodText =
    discount.method === "AUTO"
      ? "Auto-applied at checkout"
      : `Use code ${discount.code}`;

  let message = `${methodText} for ${valueText} on ${scopeText}`;

  if (discount.minOrder) {
    message += ` · Min order: $${Number(discount.minOrder).toFixed(2)}`;
  }
  if (discount.expiresAt) {
    message += ` · Expires: ${discount.expiresAt.toLocaleDateString()}`;
  }

  // Create notification and broadcast via SSE
  const notification = await db.notification.create({
    data: {
      type: "DISCOUNT",
      title: "New Discount Available!",
      message,
      data: {
        discountId: discount.id,
        code: discount.code,
        value: Number(discount.value),
        type: discount.type,
        scope: discount.scope,
        method: discount.method,
        stackable: discount.stackable,
        productNames,
        minOrder: discount.minOrder ? Number(discount.minOrder) : null,
        expiresAt: discount.expiresAt?.toISOString() ?? null,
      },
    },
  });

  broadcast({
    type: "NEW_NOTIFICATION",
    payload: {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      createdAt: notification.createdAt.toISOString(),
    },
  });

  revalidatePath("/dashboard/discounts");

  return { success: true, discount: serializeDiscount(discount) };
}

export async function updateDiscount(id: string, data: unknown) {
  await requireAdmin();

  const parsed = discountSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const input = parsed.data;

  const discount = await db.discount.findUnique({ where: { id } });
  if (!discount) {
    return { success: false, error: "Discount not found" };
  }

  // Check code uniqueness if changed
  if (input.code !== discount.code) {
    const existing = await db.discount.findUnique({
      where: { code: input.code },
    });
    if (existing) {
      return { success: false, error: "A discount with this code already exists" };
    }
  }

  await db.$transaction(async (tx) => {
    await tx.discount.update({
      where: { id },
      data: {
        code: input.code,
        description: input.description || null,
        type: input.type,
        scope: input.scope,
        method: input.method,
        stackable: input.stackable,
        value: input.value,
        minOrder: input.minOrder ?? null,
        maxUses: input.maxUses ?? null,
        isActive: input.isActive,
        startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });

    // Update product associations
    await tx.discountProduct.deleteMany({ where: { discountId: id } });
    if (input.scope === "PRODUCT" && input.productIds.length > 0) {
      await tx.discountProduct.createMany({
        data: input.productIds.map((pid) => ({
          discountId: id,
          productId: pid,
        })),
      });
    }
  });

  revalidatePath("/dashboard/discounts");

  return { success: true };
}

export async function deleteDiscount(id: string) {
  await requireAdmin();

  const discount = await db.discount.findUnique({ where: { id } });
  if (!discount) {
    return { success: false, error: "Discount not found" };
  }

  await db.discount.delete({ where: { id } });

  revalidatePath("/dashboard/discounts");

  return { success: true };
}

export async function toggleDiscount(id: string) {
  await requireAdmin();

  const discount = await db.discount.findUnique({ where: { id } });
  if (!discount) {
    return { success: false, error: "Discount not found" };
  }

  await db.discount.update({
    where: { id },
    data: { isActive: !discount.isActive },
  });

  revalidatePath("/dashboard/discounts");

  return { success: true };
}

// Helper: fetch products/variants and calculate subtotal from DB prices
async function calculateCartSubtotal(
  cartItems: { id: string; quantity: number; variantId?: string }[]
) {
  const productIds = cartItems.map((i) => i.id);
  const products = await db.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });

  const variantIds = cartItems
    .filter((i) => i.variantId)
    .map((i) => i.variantId!);
  const variants =
    variantIds.length > 0
      ? await db.productVariant.findMany({
          where: { id: { in: variantIds } },
        })
      : [];

  const subtotal = cartItems.reduce((sum, item) => {
    if (item.variantId) {
      const variant = variants.find((v) => v.id === item.variantId);
      return variant ? sum + Number(variant.price) * item.quantity : sum;
    }
    const product = products.find((p) => p.id === item.id);
    return product ? sum + Number(product.price) * item.quantity : sum;
  }, 0);

  return { products, variants, subtotal };
}

// Helper: calculate discount amount for a given discount and cart
function calculateDiscountAmount(
  discount: {
    type: string;
    scope: string;
    value: unknown;
    products: { productId: string }[];
  },
  cartItems: { id: string; quantity: number; variantId?: string }[],
  products: { id: string; price: unknown }[],
  variants: { id: string; price: unknown }[],
  subtotal: number
) {
  let amount = 0;
  if (discount.scope === "ORDER") {
    amount =
      discount.type === "PERCENTAGE"
        ? subtotal * (Number(discount.value) / 100)
        : Math.min(Number(discount.value), subtotal);
  } else {
    const eligibleProductIds = new Set(
      discount.products.map((dp) => dp.productId)
    );
    const eligibleSubtotal = cartItems.reduce((sum, item) => {
      if (!eligibleProductIds.has(item.id)) return sum;
      if (item.variantId) {
        const variant = variants.find((v) => v.id === item.variantId);
        return variant ? sum + Number(variant.price) * item.quantity : sum;
      }
      const product = products.find((p) => p.id === item.id);
      return product ? sum + Number(product.price) * item.quantity : sum;
    }, 0);
    amount =
      discount.type === "PERCENTAGE"
        ? eligibleSubtotal * (Number(discount.value) / 100)
        : Math.min(Number(discount.value), eligibleSubtotal);
  }
  return Math.round(amount * 100) / 100;
}

export async function applyDiscountCode(
  code: string,
  cartItems: { id: string; quantity: number; variantId?: string }[],
  existingDiscountIds?: string[]
) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Please sign in to use discount codes" };
  }

  const parsed = applyDiscountSchema.safeParse({ code });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const discount = await db.discount.findUnique({
    where: { code: parsed.data.code.toUpperCase().trim() },
    include: { products: true },
  });

  if (!discount || !discount.isActive) {
    return { success: false, error: "Invalid or inactive discount code" };
  }

  // CODE discounts can only be used by users registered before the discount was created
  if (discount.method === "CODE") {
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { createdAt: true },
    });
    if (user && user.createdAt >= discount.createdAt) {
      return {
        success: false,
        error: "This discount is only available for existing members",
      };
    }
  }

  // AUTO discounts cannot be applied manually via code
  if (discount.method === "AUTO") {
    return {
      success: false,
      error: "This discount is automatically applied at checkout",
    };
  }

  // Check already applied
  if (existingDiscountIds?.includes(discount.id)) {
    return { success: false, error: "This discount is already applied" };
  }

  // Check stacking compatibility
  if (existingDiscountIds && existingDiscountIds.length > 0) {
    if (!discount.stackable) {
      // Non-stackable discount replaces all existing ones
      return await _validateAndReturn(discount, cartItems, true);
    }
    // New discount is stackable — check existing are all stackable too
    const existingDiscounts = await db.discount.findMany({
      where: { id: { in: existingDiscountIds } },
      select: { stackable: true, code: true },
    });
    const nonStackable = existingDiscounts.find((d) => !d.stackable);
    if (nonStackable) {
      return {
        success: false,
        error: `Cannot combine with non-stackable discount "${nonStackable.code}"`,
      };
    }
  }

  const now = new Date();
  if (discount.startsAt > now) {
    return { success: false, error: "This discount is not yet active" };
  }
  if (discount.expiresAt && discount.expiresAt < now) {
    return { success: false, error: "This discount has expired" };
  }
  if (discount.maxUses && discount.usedCount >= discount.maxUses) {
    return { success: false, error: "This discount has reached its usage limit" };
  }

  const { products, variants, subtotal } = await calculateCartSubtotal(cartItems);

  if (discount.minOrder && subtotal < Number(discount.minOrder)) {
    return {
      success: false,
      error: `Minimum order of $${Number(discount.minOrder).toFixed(2)} required`,
    };
  }

  const discountAmount = calculateDiscountAmount(
    discount,
    cartItems,
    products,
    variants,
    subtotal
  );

  return {
    success: true,
    replaceAll: false,
    discount: {
      id: discount.id,
      code: discount.code,
      type: discount.type,
      scope: discount.scope,
      method: discount.method,
      stackable: discount.stackable,
      value: Number(discount.value),
      amount: discountAmount,
      description: discount.description,
    },
  };
}

// Helper for non-stackable discount that replaces all
async function _validateAndReturn(
  discount: { id: string; code: string; type: string; scope: string; method: string; stackable: boolean; value: unknown; minOrder: unknown; maxUses: number | null; usedCount: number; startsAt: Date; expiresAt: Date | null; description: string | null; products: { productId: string }[] },
  cartItems: { id: string; quantity: number; variantId?: string }[],
  replaceAll: boolean
) {
  const now = new Date();
  if (discount.startsAt > now) {
    return { success: false, error: "This discount is not yet active" };
  }
  if (discount.expiresAt && discount.expiresAt < now) {
    return { success: false, error: "This discount has expired" };
  }
  if (discount.maxUses && discount.usedCount >= discount.maxUses) {
    return { success: false, error: "This discount has reached its usage limit" };
  }

  const { products, variants, subtotal } = await calculateCartSubtotal(cartItems);

  if (discount.minOrder && subtotal < Number(discount.minOrder)) {
    return {
      success: false,
      error: `Minimum order of $${Number(discount.minOrder).toFixed(2)} required`,
    };
  }

  const discountAmount = calculateDiscountAmount(
    discount,
    cartItems,
    products,
    variants,
    subtotal
  );

  return {
    success: true as const,
    replaceAll,
    discount: {
      id: discount.id,
      code: discount.code,
      type: discount.type,
      scope: discount.scope,
      method: discount.method,
      stackable: discount.stackable,
      value: Number(discount.value),
      amount: discountAmount,
      description: discount.description,
    },
  };
}

export async function getAutoApplyDiscounts(
  cartItems: { id: string; quantity: number; variantId?: string }[]
) {
  const session = await getSession();
  if (!session) return { success: false, discounts: [] };

  if (cartItems.length === 0) return { success: true, discounts: [] };

  const now = new Date();

  // Find all active AUTO discounts
  const autoDiscounts = await db.discount.findMany({
    where: {
      method: "AUTO",
      isActive: true,
      startsAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
    },
    include: { products: true },
  });

  if (autoDiscounts.length === 0) return { success: true, discounts: [] };

  const { products, variants, subtotal } = await calculateCartSubtotal(cartItems);

  type EligibleDiscount = {
    discount: (typeof autoDiscounts)[number];
    amount: number;
  };

  const stackableEligible: EligibleDiscount[] = [];
  let bestNonStackable: EligibleDiscount | null = null;

  for (const discount of autoDiscounts) {
    if (discount.maxUses && discount.usedCount >= discount.maxUses) continue;
    if (discount.minOrder && subtotal < Number(discount.minOrder)) continue;

    if (discount.scope === "PRODUCT") {
      const eligibleIds = new Set(discount.products.map((dp) => dp.productId));
      const hasEligible = cartItems.some((item) => eligibleIds.has(item.id));
      if (!hasEligible) continue;
    }

    const amount = calculateDiscountAmount(
      discount,
      cartItems,
      products,
      variants,
      subtotal
    );

    if (amount <= 0) continue;

    if (discount.stackable) {
      stackableEligible.push({ discount, amount });
    } else {
      if (!bestNonStackable || amount > bestNonStackable.amount) {
        bestNonStackable = { discount, amount };
      }
    }
  }

  // Compare: all stackable combined vs best non-stackable
  const stackableTotal = stackableEligible.reduce((s, e) => s + e.amount, 0);
  const bestNonStackableAmount = bestNonStackable?.amount ?? 0;

  const serialize = (e: EligibleDiscount) => ({
    id: e.discount.id,
    code: e.discount.code,
    type: e.discount.type,
    scope: e.discount.scope,
    method: e.discount.method,
    stackable: e.discount.stackable,
    value: Number(e.discount.value),
    amount: e.amount,
    description: e.discount.description,
  });

  if (stackableTotal >= bestNonStackableAmount && stackableEligible.length > 0) {
    return {
      success: true,
      discounts: stackableEligible.map(serialize),
    };
  }

  if (bestNonStackable) {
    return {
      success: true,
      discounts: [serialize(bestNonStackable)],
    };
  }

  return { success: true, discounts: [] };
}
