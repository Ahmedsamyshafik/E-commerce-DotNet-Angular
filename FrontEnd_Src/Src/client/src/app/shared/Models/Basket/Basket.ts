export interface IBasket {
  items: Item[];
  total: number;
}

export interface Item {
  productName: string;
  productImgsUrl: string[];
  productDescription: string;
  quantity: number;
  productId: number;
  unitPrice: number;
  priceExpiresAt: string | null;
  total: number;
}

/**
 * Request body of POST Cart/Add. Field name matches the API contract
 * (`Quentity` is the spelling used by the backend DTO).
 */
export interface IAddBasket {
  productId: number;
  Quentity: number;
}

export interface IBasketTotal {
  shipping: number;
  subTotal: number;
  total: number;
}
