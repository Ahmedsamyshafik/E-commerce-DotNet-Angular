import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IStandaloneResponse } from '../../shared/Models/StandaloneResponse';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private readonly baseUrl = environment.BASEURL;

  constructor(private readonly http: HttpClient) {}

  /**
   * Body is intentionally empty: the API creates the session from the signed-in
   * user's latest Pending order (the order id is not part of this contract).
   */
  createCheckoutSession(): Observable<IStandaloneResponse<string>> {
    return this.http.post<IStandaloneResponse<string>>(
      `${this.baseUrl}/Payment/GeneratePayment`,
      {},
    );
  }
}
