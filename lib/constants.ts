export const APP_NAME = "Shop V2";

export const ITEMS_PER_PAGE = 12;
export const PER_PAGE_OPTIONS = [12, 24, 48];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: "Cash on Delivery",
  STRIPE: "Credit/Debit Card",
  MOMO: "MoMo",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Awaiting Payment",
  PAID: "Paid",
  FAILED: "Payment Failed",
  REFUNDED: "Refunded",
  EXPIRED: "Payment Expired",
};

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Categories", href: "/categories" },
] as const;
