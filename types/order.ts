import type { Product } from "./product";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentMethod = "COD" | "STRIPE" | "MOMO";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "EXPIRED";

export type Order = {
  id: string;
  orderNumber: string;
  userId: string;
  addressId: string | null;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discountCode: string | null;
  discountAmount: number;
  total: number;
  note: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId: string | null;
  currency: string;
  items?: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  price: number;
  product?: Product;
};
