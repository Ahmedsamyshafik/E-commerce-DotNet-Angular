export interface ICreateOrder {
  deliveryMethodId: number;
  shipAddress: IShippingAddress;
}

export interface IShippingAddress {
  firstName: string;
  lastName: string;
  city: string;
  zipCode: string;
  street: string;
  state: string;
}

export interface Delivery {
  id: number;
  name: string;
  description: string;
  price: number;
  deliveryTime: number;
}

/** Read model returned by POST Order/CreateOrder. */
export interface IOrder {
  id: number;
  buyerEmail: string;
  subTotal: number;
  total: number;
  orderDate: string;
  shippingAddress: IShippingAddress;
  orderItems: IOrderItem[];
  deliveryMethod: string;
  status: string;
}

export interface IOrderItem {
  productItemId: number;
  mainImage: string;
  productName: string;
  price: number;
  quntity: number;
}

/** Read model returned by GET Order/GetAllOrders. */
export interface IOrderSummary {
  orderId: number;
  createdAt: string;
  deliveryMethodId: number;
  shipAddress: IShippingAddress;
  items: IOrderSummaryItem[];
  subTotal: number;
  total: number;
  /** Pending | PaymentReceived | PaymentFaild */
  status: string;
}

export interface IOrderSummaryItem {
  id?: number;
  productItemId: number;
  mainImg: string;
  productName: string;
  price: number;
  quentity: number;
  orderId?: number;
}
