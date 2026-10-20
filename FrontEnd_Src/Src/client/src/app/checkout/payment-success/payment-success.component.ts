import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Observable, Subscription, catchError, map, of, switchMap, take, timer } from 'rxjs';
import { IOrderSummary } from '../../shared/Models/Order/orderModels';
import { CheckoutService } from '../checkout.service';

type SuccessState = 'checking' | 'confirmed' | 'failed' | 'processing' | 'notFound' | 'signedOut';

const PENDING_ORDER_KEY = 'pendingOrderId';
const POLL_ATTEMPTS = 6;
const POLL_INTERVAL_MS = 3000;

/**
 * Landing page for the Stripe `SuccessUrl` (`/Success?session_id=...`).
 *
 * The `session_id` query parameter only proves the browser was redirected back. Payment
 * is confirmed exclusively from the server-side order status, which the API sets from
 * the Stripe webhook. This component never fabricates a success state.
 */
@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.scss',
})
export class PaymentSuccessComponent implements OnInit, OnDestroy {
  private readonly checkoutService = inject(CheckoutService);
  private readonly destroyRef = inject(DestroyRef);
  private pollSubscription?: Subscription;

  state: SuccessState = 'checking';
  order: IOrderSummary | null = null;
  readonly maxAttempts = POLL_ATTEMPTS;

  ngOnInit(): void {
    const orderId = this.getPendingOrderId();

    if (!localStorage.getItem('userId')) {
      this.state = 'signedOut';
      return;
    }
    if (!orderId) {
      // Nothing in this browser session links back to an order; do not guess.
      this.state = 'notFound';
      return;
    }

    this.pollOrder(orderId);
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  refresh(): void {
    window.location.reload();
  }

  private pollOrder(orderId: number): void {
    let attempts = 0;

    this.pollSubscription = timer(0, POLL_INTERVAL_MS)
      .pipe(
        take(POLL_ATTEMPTS),
        switchMap(() => this.fetchOrders()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (orders) => {
          attempts++;

          if (this.isTerminal()) {
            return;
          }

          const order = orders?.find((item) => item.orderId === orderId) ?? null;
          if (order) {
            this.order = order;
          }

          if (order?.status === 'PaymentReceived') {
            this.state = 'confirmed';
            sessionStorage.removeItem(PENDING_ORDER_KEY);
            this.stopPolling();
            return;
          }
          if (order?.status === 'PaymentFaild') {
            this.state = 'failed';
            sessionStorage.removeItem(PENDING_ORDER_KEY);
            this.stopPolling();
            return;
          }

          if (attempts >= POLL_ATTEMPTS) {
            this.state = 'processing';
          }
        },
        complete: () => {
          if (this.state === 'checking') {
            this.state = 'processing';
          }
        },
      });
  }

  private fetchOrders(): Observable<IOrderSummary[]> {
    return this.checkoutService.getOrders().pipe(
      map((response): IOrderSummary[] =>
        Array.isArray(response?.data) ? response.data : [],
      ),
      catchError((error: unknown): Observable<IOrderSummary[]> => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.state = 'signedOut';
          this.stopPolling();
        }
        return of([]);
      }),
    );
  }

  private isTerminal(): boolean {
    return this.state === 'confirmed' || this.state === 'failed' || this.state === 'signedOut';
  }

  private stopPolling(): void {
    this.pollSubscription?.unsubscribe();
    this.pollSubscription = undefined;
  }

  private getPendingOrderId(): number | null {
    const raw = sessionStorage.getItem(PENDING_ORDER_KEY);
    const orderId = raw ? Number(raw) : NaN;
    return Number.isInteger(orderId) && orderId > 0 ? orderId : null;
  }
}
