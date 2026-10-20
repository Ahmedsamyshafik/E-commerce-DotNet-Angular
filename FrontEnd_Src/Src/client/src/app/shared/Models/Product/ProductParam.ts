export class ProductParam {
    categoryId?: number;
    sort_selected?: string;
    sort_order?: string;
    search?: string;
    pageNumber: number = 1;
    pageSize: number = 3;
}