import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { EMPTY, Observable, catchError, finalize, map, of, switchMap, tap } from 'rxjs';
import { BasketService } from '../../basket/basket.service';
import { ICreateOrder, IShippingAddress } from '../../shared/Models/Order/orderModels';
import { CheckoutService } from '../checkout.service';
import { PaymentService } from './payment.service';

type PendingOrderCheck =
  | { kind: 'none' }
  | { kind: 'reusable'; orderId: number }
  | { kind: 'paid' };

const PENDING_ORDER_KEY = 'pendingOrderId';

@Component({
  selector: 'app-payment',
  standalone: false,
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss',
})
export class PaymentComponent implements OnInit {
  @Input({ required: true }) delivery!: FormGroup;
  @Input({ required: true }) Address!: FormGroup;

  subtotal = 0;
  shipping = 0;
  isLoading = false;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly basketService: BasketService,
    private readonly checkoutService: CheckoutService,
    private readonly toastr: ToastrService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.basketService.basketTotal$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((totals) => {
        this.subtotal = totals.subTotal;
        this.shipping = totals.shipping;
      });
  }

  get total(): number {
    return this.subtotal + this.shipping;
  }

  get canPay(): boolean {
    const totals = this.basketService.getInfoForPayment();
    const canPayForCart =
      this.basketService.hasItems() && this.basketService.deliveryId > 0 && totals.total > 0;
    return (
      !this.isLoading &&
      !!this.Address?.valid &&
      !!this.delivery?.valid &&
      this.basketService.deliveryId > 0 &&
      (canPayForCart || this.hasPendingOrder)
    );
  }

  get hasPendingOrder(): boolean {
    return this.getPendingOrderId() !== null;
  }

  get hasBasketItems(): boolean {
    return this.basketService.hasItems();
  }

  payNow(): void {
    if (this.isLoading || !this.validateCheckout()) {
      return;
    }

    this.isLoading = true;

    this.resolvePendingOrder()
      .pipe(
        switchMap((pending) => {
          if (pending.kind === 'paid') {
            this.toastr.info('This order has already been paid.', 'Payment');
            this.router.navigate(['/Success']);
            return EMPTY;
          }
          // Reuse the existing Pending order only while the cart is still empty (the API
          // cleared it when the order was created). If the user added new items, a new
          // order is needed so they are not charged for the old order's contents.
          if (pending.kind === 'reusable' && !this.basketService.hasItems()) {
            return this.startCheckoutSession();
          }
          if (pending.kind === 'none' && !this.basketService.hasItems()) {
            this.toastr.warning('Your cart is empty. Please add items before checking out.', 'Checkout');
            return EMPTY;
          }
          return this.createOrderThenStartSession();
        }),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        error: (error: unknown) => {
          const message =
            error instanceof HttpErrorResponse && error.status === 401
              ? 'Please sign in to continue.'
              : this.hasPendingOrder
                ? 'Your order is saved, but the payment page could not be opened. Please try again.'
                : 'We could not start the payment. Please try again in a moment.';
          this.toastr.error(message, 'Payment');
        },
      });
  }

  private validateCheckout(): boolean {
    this.Address.markAllAsTouched();
    this.delivery.markAllAsTouched();

    if (this.Address.invalid || this.delivery.invalid) {
      this.toastr.warning(
        'Please complete your shipping address and delivery method.',
        'Checkout',
      );
      return false;
    }
    if (!this.basketService.deliveryId) {
      this.toastr.warning('Please choose a delivery method.', 'Checkout');
      return false;
    }

    const totals = this.basketService.getInfoForPayment();
    this.subtotal = totals.subTotal;
    this.shipping = totals.shipping;

    if (this.hasPendingOrder) {
      // The API already cleared the server cart. A saved Pending order can still be paid.
      return true;
    }

    if (!this.basketService.hasItems()) {
      this.toastr.warning('Your cart is empty.', 'Checkout');
      return false;
    }
    if (!(this.total > 0)) {
      this.toastr.warning('The order total is not valid yet. Please review your cart.', 'Checkout');
      return false;
    }
    return true;
  }

  private createOrderThenStartSession(): Observable<void> {
    const order: ICreateOrder = {
      deliveryMethodId: this.basketService.deliveryId,
      shipAddress: this.Address.getRawValue() as IShippingAddress,
    };

    return this.basketService.SyncBasketNow().pipe(
      switchMap(() => this.checkoutService.CreateOrder(order)),
      tap((response) => {
        const orderId = response?.data?.id;
        if (!Number.isInteger(orderId) || orderId <= 0) {
          throw new Error('The order response did not include a valid order id.');
        }
        sessionStorage.setItem(PENDING_ORDER_KEY, String(orderId));
        // The API clears the server cart once the order exists; update the UI at once.
        this.basketService.ClearLocalBasket();
      }),
      switchMap(() => this.startCheckoutSession()),
    );
  }

  private startCheckoutSession(): Observable<void> {
    return this.paymentService.createCheckoutSession().pipe(
      map((response) => {
        const url = response?.data;
        if (typeof url !== 'string' || !/^https:\/\//i.test(url)) {
          throw new Error('The payment provider did not return a secure checkout URL.');
        }
        window.location.href = url;
      }),
    );
  }

  /**
   * A Pending order from a previous attempt (same browser session) is reused instead of
   * creating another one. If its state cannot be verified, the existing order is reused
   * to avoid duplicate order creation (backend idempotency is not assumed).
   */
  private resolvePendingOrder(): Observable<PendingOrderCheck> {
    const orderId = this.getPendingOrderId();
    if (!orderId) {
      return of({ kind: 'none' });
    }

    return this.checkoutService.getOrders().pipe(
      map((response) => {
        const order = response?.data?.find((item) => item.orderId === orderId);
        if (!order) {
          this.clearPendingOrderId();
          return { kind: 'none' } as PendingOrderCheck;
        }
        if (order.status === 'PaymentReceived') {
          return { kind: 'paid' } as PendingOrderCheck;
        }
        if (order.status === 'Pending') {
          return { kind: 'reusable', orderId } as PendingOrderCheck;
        }
        this.clearPendingOrderId();
        return { kind: 'none' } as PendingOrderCheck;
      }),
      catchError(() => of({ kind: 'reusable', orderId } as PendingOrderCheck)),
    );
  }

  private getPendingOrderId(): number | null {
    const raw = sessionStorage.getItem(PENDING_ORDER_KEY);
    const orderId = raw ? Number(raw) : NaN;
    return Number.isInteger(orderId) && orderId > 0 ? orderId : null;
  }

  private clearPendingOrderId(): void {
    sessionStorage.removeItem(PENDING_ORDER_KEY);
  }
}
