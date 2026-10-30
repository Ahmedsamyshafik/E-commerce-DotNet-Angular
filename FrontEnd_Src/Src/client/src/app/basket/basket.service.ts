import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
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
import { AuthService } from '../core/services/auth.service';

const EMPTY_TOTAL: IBasketTotal = { shipping: 0, subTotal: 0, total: 0 };
const GUEST_CART_KEY = 'guestCartId';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    private readonly auth: AuthService,
  ) {}

  /**
   * Guest cart id persisted in localStorage. The SPA sends it as X-Cart-Id on every cart
   * request, so the basket survives a refresh even when the browser drops the cart cookie
   * (for example when the API and dev server are on different schemes). Signed-in users are
   * identified by their JWT, so no guest id is needed for them.
   */
  getGuestCartId(): string {
    let id = localStorage.getItem(GUEST_CART_KEY);
    if (!id || !UUID_PATTERN.test(id)) {
      id = this.createGuestCartId();
      localStorage.setItem(GUEST_CART_KEY, id);
    }
    return id;
  }

  /** Drops the guest id after a successful merge or logout so the next guest gets a new cart. */
  clearGuestCartId(): void {
    localStorage.removeItem(GUEST_CART_KEY);
  }

  GetBasket(): Observable<IBasket | null> {
    return this.http.get<IStandaloneResponse<IBasket>>(`${this.baseUrl}/Get`, this.cartOptions()).pipe(
      map((response) => response?.data ?? null),
      tap((basket) => this.applyBasket(basket)),
      catchError((error) => {
        this.notifyError(error, 'We could not load your cart.');
        return of(null);
      }),
    );
  }

  SetBasket(basket: IAddBasket): Observable<IBasket | null> {
    return this.http
      .post<IStandaloneResponse<IBasket>>(`${this.baseUrl}/Add`, basket, this.cartOptions())
      .pipe(
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

    return this.http
      .patch<IStandaloneResponse<IBasket>>(`${this.baseUrl}/UpdateCart`, request, this.cartOptions())
      .pipe(
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

  /**
   * Cart requests carry the guest id only while the shopper is signed out. Once the JWT is
   * active the server uses its NameIdentifier claim and ignores the guest header.
   */
  private cartOptions(): { headers?: { [header: string]: string } } {
    if (this.auth.isAuthenticated || this.auth.userId) {
      return {};
    }

    return { headers: { 'X-Cart-Id': this.getGuestCartId() } };
  }

  private createGuestCartId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    const bytes = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i += 1) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }

    // RFC 4122 version 4 layout.
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
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
