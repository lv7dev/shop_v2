import { db } from "@/lib/db";
import { sendToUser } from "@/lib/sse";

const DEFAULT_THRESHOLD = 10;

type StockItem = {
  productId: string;
  variantId?: string | null;
  quantity: number;
};

/**
 * Check if any products/variants dropped below their low-stock threshold
 * after an order. Creates per-admin notifications so customers never see them.
 */
export async function checkLowStock(items: StockItem[]) {
  try {
    const productIds = [...new Set(items.map((i) => i.productId))];
    const variantIds = items
      .filter((i) => i.variantId)
      .map((i) => i.variantId!);

    // Fetch current stock levels after decrement
    const [products, variants] = await Promise.all([
      db.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, stock: true, lowStockThreshold: true, images: true },
      }),
      variantIds.length > 0
        ? db.productVariant.findMany({
            where: { id: { in: variantIds } },
            select: {
              id: true,
              stock: true,
              sku: true,
              product: { select: { id: true, name: true, lowStockThreshold: true, images: true } },
            },
          })
        : [],
    ]);

    const alerts: { name: string; stock: number; threshold: number; productId: string; variantId?: string; image?: string }[] = [];

    // Check base product stock (only for items without variants)
    for (const item of items) {
      if (item.variantId) continue;
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;

      const threshold = product.lowStockThreshold ?? DEFAULT_THRESHOLD;
      if (product.stock <= threshold) {
        // Avoid duplicate alerts for same product
        if (!alerts.some((a) => a.productId === product.id && !a.variantId)) {
          alerts.push({
            name: product.name,
            stock: product.stock,
            threshold,
            productId: product.id,
            image: product.images[0],
          });
        }
      }
    }

    // Check variant stock
    for (const variant of variants) {
      const threshold = variant.product.lowStockThreshold ?? DEFAULT_THRESHOLD;
      if (variant.stock <= threshold) {
        alerts.push({
          name: `${variant.product.name}${variant.sku ? ` (${variant.sku})` : ""}`,
          stock: variant.stock,
          threshold,
          productId: variant.product.id,
          variantId: variant.id,
          image: variant.product.images[0],
        });
      }
    }

    if (alerts.length === 0) return;

    // Fetch all admin user IDs
    const admins = await db.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (admins.length === 0) return;

    // Create one notification per alert per admin (properly scoped)
    const notificationData = alerts.flatMap((alert) =>
      admins.map((admin) => ({
        type: "LOW_STOCK" as const,
        title: alert.stock === 0
          ? `Out of stock: ${alert.name}`
          : `Low stock: ${alert.name}`,
        message: alert.stock === 0
          ? `"${alert.name}" is now out of stock.`
          : `"${alert.name}" has only ${alert.stock} unit${alert.stock === 1 ? "" : "s"} left (threshold: ${alert.threshold}).`,
        data: {
          productId: alert.productId,
          variantId: alert.variantId ?? null,
          stock: alert.stock,
          threshold: alert.threshold,
          image: alert.image ?? null,
        },
        userId: admin.id,
      }))
    );

    const notifications = await db.notification.createManyAndReturn({
      data: notificationData,
    });

    // Send real-time SSE to each admin
    for (const notification of notifications) {
      if (!notification.userId) continue;
      sendToUser(notification.userId, {
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
    }
  } catch (error) {
    // Don't fail the order if low-stock check fails
    console.error("Low stock check error:", error);
  }
}
