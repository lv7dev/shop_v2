export type CartItemInput = {
  id: string;
  quantity: number;
  variantId?: string;
};

export type CartItemWithPrice = CartItemInput & {
  price: number;
};

export type CartDbItemInput = {
  productId: string;
  quantity: number;
  variantId?: string | null;
};
