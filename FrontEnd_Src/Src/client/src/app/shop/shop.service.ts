import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { ICategory } from '../shared/Models/Pagination/category';
import { IPagination } from '../shared/Models/Pagination/pagination';
import { Iproduct } from '../shared/Models/Pagination/product';
import { ProductParam } from '../shared/Models/Product/ProductParam';
import { IProductDetails } from '../shared/Models/Product/productDetails';
import { IStandaloneResponse } from '../shared/Models/StandaloneResponse';

@Injectable({
  providedIn: 'root',
})
export class ShopService {
  private readonly baseUrl = environment.BASEURL;

  constructor(private readonly http: HttpClient) {}

  getCategories() {
    return this.http.get<IStandaloneResponse<IPagination<ICategory>>>(
      `${this.baseUrl}/Category/GetAll`,
    );
  }

  getProducts(productParam: ProductParam) {
    let params = new HttpParams();

    if (productParam.categoryId) {
      params = params.append('CategoryId', productParam.categoryId);
    }
    if (productParam.sort_selected) {
      params = params.append('SortBy', productParam.sort_selected);
    }
    if (productParam.sort_order) {
      params = params.append('SortOrder', productParam.sort_order);
    }
    if (productParam.search) {
      params = params.append('Search', productParam.search);
    }
    params = params.append('PageNumber', productParam.pageNumber);
    params = params.append('PageSize', productParam.pageSize);

    return this.http.get<IStandaloneResponse<IPagination<Iproduct>>>(
      `${this.baseUrl}/Product/GetAll`,
      { params },
    );
  }

  getProductById(id: string) {
    return this.http.get<IStandaloneResponse<IProductDetails>>(
      `${this.baseUrl}/Product/GetById/${id}`,
    );
  }
}
