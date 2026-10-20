export interface ProductModel {
  id: number;
  name: string;
  price: number;
  description: string;
  stock: number;
  productList: ProductModel[] | null;
}

export interface CheckoutItem {
  name: string;
  price: number;
  quantity: number;
}