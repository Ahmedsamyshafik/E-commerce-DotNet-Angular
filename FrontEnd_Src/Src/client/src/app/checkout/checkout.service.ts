import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { IStandaloneResponse } from '../shared/Models/StandaloneResponse';
import {
  Delivery,
  ICreateOrder,
  IOrder,
  IOrderSummary,
  IShippingAddress,
} from '../shared/Models/Order/orderModels';

@Injectable({
  providedIn: 'root',
})
export class CheckoutService {
  private readonly baseUrl = environment.BASEURL;

  constructor(private readonly http: HttpClient) {}

  updateAddress(form: IShippingAddress) {
    return this.http.put<IStandaloneResponse<IShippingAddress>>(
      `${this.baseUrl}/Account/UpdateAddress`,
      form,
    );
  }

  getAddress() {
    return this.http.get<IStandaloneResponse<IShippingAddress>>(
      `${this.baseUrl}/Account/GetAddress`,
    );
  }

  getDeliveryMethod() {
    return this.http.get<IStandaloneResponse<Delivery[]>>(
      `${this.baseUrl}/Order/GetAllDeliveryMethod`,
    );
  }

  CreateOrder(order: ICreateOrder) {
    return this.http.post<IStandaloneResponse<IOrder>>(
      `${this.baseUrl}/Order/CreateOrder`,
      order,
    );
  }

  getOrders() {
    return this.http.get<IStandaloneResponse<IOrderSummary[]>>(
      `${this.baseUrl}/Order/GetAllOrders`,
    );
  }
}
