import { IPhoto } from '../Pagination/product';

export interface IProductDetails {
  id: number;
  name: string;
  realPrice: number;
  priceAfterDiscount: number;
  categoryName: string;
  categoryId: number;
  description: string;
  rowVersion: string;
  photoUrls: IPhoto[];
}
