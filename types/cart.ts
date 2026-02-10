export type CartItemInput = {
  id: string;
  quantity: number;
};

export type CartItemWithPrice = CartItemInput & {
  price: number;
};

export type CartDbItemInput = {
  productId: string;
  quantity: number;
};
