import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  catchError,
  map,
  of,
  tap,
  throwError,
} from 'rxjs';
import { environment } from '../../environments/environment';
import { IAddBasket, IBasket, IBasketTotal, Item } from '../shared/Models/Basket/Basket';
import { Delivery } from '../shared/Models/Order/orderModels';
import { IStandaloneResponse } from '../shared/Models/StandaloneResponse';
import { getHttpErrorMessage } from '../shared/utils/http-error.util';

const EMPTY_TOTAL: IBasketTotal = { shipping: 0, subTotal: 0, total: 0 };
const USER_ID_KEY = 'userId';

@Injectable({
  providedIn: 'root',
})
export class BasketService {
  private readonly baseUrl = `${environment.BASEURL}/Cart`;
  private readonly basketSource = new BehaviorSubject<IBasket | null>(null);
  readonly basket$ = this.basketSource.asObservable();
  private readonly basketTotalSource = new BehaviorSubject<IBasketTotal>(EMPTY_TOTAL);
  readonly basketTotal$ = this.basketTotalSource.asObservable();
  private syncErrorShown = false;
  private syncTimer: ReturnType<typeof setTimeout> | null = null;
  private backgroundSyncSubscription: Subscription | null = null;

  shipPrice = 0;
  deliveryId = 0;

  constructor(
    private readonly http: HttpClient,
    private readonly toastr: ToastrService,
    private readonly router: Router,
  ) {}

  get isAuthenticated(): boolean {
    return !!localStorage.getItem(USER_ID_KEY);
  }

  GetBasket(): Observable<IBasket | null> {
    return this.http.get<IStandaloneResponse<IBasket>>(`${this.baseUrl}/Get`).pipe(
      map((response) => response?.data ?? null),
      tap((basket) => this.applyBasket(basket)),
      catchError((error) => {
        this.notifyError(error, 'We could not load your cart.');
        return of(null);
      }),
    );
  }

  SetBasket(basket: IAddBasket): Observable<IBasket | null> {
    if (!this.isAuthenticated) {
      this.toastr.info('Please sign in to add items to your cart.', 'Sign in required');
      this.router.navigate(['/account/login']);
      return of(null);
    }

    return this.http.post<IStandaloneResponse<IBasket>>(`${this.baseUrl}/Add`, basket).pipe(
      map((response) => response?.data ?? null),
      tap((result) => {
        if (result) {
          this.applyBasket(result);
        }
      }),
      catchError((error) => {
        this.notifyError(error, 'We could not add this item to your cart.');
        return of(null);
      }),
    );
  }

  SetShippingPrice(delivery: Delivery | undefined): void {
    this.deliveryId = delivery?.id ?? 0;
    this.shipPrice = delivery?.price ?? 0;
    this.calculateTotal();
  }

  Increase(item: Item): void {
    const basket = this.basketSource.value;
    if (!basket) return;

    item.quantity = this.toSafeQuantity(item.quantity) + 1;
    item.total = item.quantity * (Number(item.unitPrice) || 0);
    this.basketSource.next({ ...basket, items: [...basket.items] });
    this.calculateTotal();
    this.queueSync();
  }

  Decrease(item: Item): void {
    const basket = this.basketSource.value;
    if (!basket) return;

    if (this.toSafeQuantity(item.quantity) <= 1) {
      this.Remove(item);
      return;
    }

    item.quantity = this.toSafeQuantity(item.quantity) - 1;
    item.total = item.quantity * (Number(item.unitPrice) || 0);
    this.basketSource.next({ ...basket, items: [...basket.items] });
    this.calculateTotal();
    this.queueSync();
  }

  Remove(item: Item): void {
    const basket = this.basketSource.value;
    if (!basket) return;

    const items = basket.items.filter((current) => current !== item);
    this.basketSource.next({ ...basket, items });
    this.calculateTotal();
    this.queueSync();
  }

  /**
   * Persists the current cart immediately. Used before creating an order so the
   * server-side cart cannot be ahead of/behind the on-screen quantities.
   * Errors are propagated so callers can stop before placing the order.
   */
  SyncBasketNow(): Observable<IBasket | null> {
    this.cancelPendingSync();
    return this.syncBasket(false);
  }

  /** Clears the local basket after the API confirmed the order and emptied the server cart. */
  ClearLocalBasket(): void {
    this.cancelPendingSync();
    this.applyBasket({ items: [], total: 0 });
  }

  hasItems(): boolean {
    return (this.basketSource.value?.items?.length ?? 0) > 0;
  }

  getInfoForPayment(): IBasketTotal {
    return this.basketTotalSource.value;
  }

  private queueSync(): void {
    this.cancelPendingSync();
    this.syncTimer = setTimeout(() => {
      this.syncTimer = null;
      this.backgroundSyncSubscription = this.syncBasket(true).subscribe({
        error: () => undefined,
        complete: () => {
          this.backgroundSyncSubscription = null;
        },
      });
    }, 500);
  }

  private cancelPendingSync(): void {
    if (this.syncTimer !== null) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    if (this.backgroundSyncSubscription) {
      this.backgroundSyncSubscription.unsubscribe();
      this.backgroundSyncSubscription = null;
    }
  }

  private syncBasket(notifyOnError: boolean): Observable<IBasket | null> {
    const basket = this.basketSource.value;
    if (!basket) {
      return of(null);
    }

    const request = {
      items: basket.items.map((item) => ({
        productId: item.productId,
        quantity: this.toSafeQuantity(item.quantity),
      })),
    };

    return this.http.patch<IStandaloneResponse<IBasket>>(`${this.baseUrl}/UpdateCart`, request).pipe(
      map((response) => response?.data ?? null),
      tap((result) => {
        if (result) {
          this.applyBasket(result);
        }
        this.syncErrorShown = false;
      }),
      catchError((error) => {
        if (notifyOnError) {
          this.notifySyncError();
        }
        return throwError(() => error);
      }),
    );
  }

  private applyBasket(basket: IBasket | null): void {
    const normalized: IBasket = {
      items: Array.isArray(basket?.items) ? basket.items : [],
      total: Number(basket?.total) || 0,
    };
    this.basketSource.next(normalized);
    this.calculateTotal();
  }

  private calculateTotal(): void {
    const items = this.basketSource.value?.items ?? [];
    const subTotal = items.reduce(
      (sum, item) => sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0),
      0,
    );
    const shipping = Number(this.shipPrice) || 0;
    this.basketTotalSource.next({ shipping, subTotal, total: shipping + subTotal });
  }

  private toSafeQuantity(quantity: number): number {
    const parsed = Math.floor(Number(quantity));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }

  private notifyError(error: unknown, fallback: string): void {
    this.toastr.error(getHttpErrorMessage(error, fallback), 'Cart');
  }

  private notifySyncError(): void {
    if (this.syncErrorShown) return;
    this.syncErrorShown = true;
    this.toastr.error('Your cart could not be saved. Please check your connection.', 'Cart');
  }
}
