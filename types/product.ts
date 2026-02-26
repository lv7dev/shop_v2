export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  sku: string | null;
  stock: number;
  images: string[];
  attributes: Record<string, string> | null;
  isActive: boolean;
  categoryId: string | null;
  category?: Category | null;
  reviews?: Review[];
  createdAt: Date;
  updatedAt: Date;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  parent?: Category | null;
  children?: Category[];
  products?: Product[];
  createdAt: Date;
  updatedAt: Date;
};

export type Review = {
  id: string;
  rating: number;
  comment: string | null;
  userId: string;
  productId: string;
  createdAt: Date;
};
