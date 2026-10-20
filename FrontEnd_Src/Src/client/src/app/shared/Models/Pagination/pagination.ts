import { Iproduct } from './product';

export interface IPagination<T> {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  data: T[];
}
