export interface Iproduct {
  id: number;
  name: string;
  realPrice: number;
  priceAfterDiscount?: number;
  categoryName: string;
  description: string;
  rowVersion: string;
  photoUrls: IPhoto[];
}

export interface IPhoto {
  id: number;
  url: string;
}
