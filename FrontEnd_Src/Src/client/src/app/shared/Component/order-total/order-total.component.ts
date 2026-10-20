import { Component, inject } from '@angular/core';
import { BasketService } from '../../../basket/basket.service';

@Component({
  selector: 'app-order-total',
  standalone: false,
  templateUrl: './order-total.component.html',
  styleUrl: './order-total.component.scss',
})
export class OrderTotalComponent {
  readonly basketTotal$ = inject(BasketService).basketTotal$;
}
