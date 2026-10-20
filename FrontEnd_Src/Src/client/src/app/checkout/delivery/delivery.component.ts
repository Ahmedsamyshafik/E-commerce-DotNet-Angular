import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { BasketService } from '../../basket/basket.service';
import { Delivery } from '../../shared/Models/Order/orderModels';
import { getHttpErrorMessage } from '../../shared/utils/http-error.util';
import { CheckoutService } from '../checkout.service';

@Component({
  selector: 'app-delivery',
  standalone: false,
  templateUrl: './delivery.component.html',
  styleUrl: './delivery.component.scss',
})
export class DeliveryComponent implements OnInit {
  @Input({ required: true }) delivery!: FormGroup;

  deliveries: Delivery[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly basketService: BasketService,
    private readonly toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.checkoutService.getDeliveryMethod().subscribe({
      next: (response) => {
        this.deliveries = response?.data ?? [];
        this.isLoading = false;
        if (!this.deliveries.length) {
          this.errorMessage = 'No delivery methods are available right now.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'We could not load the delivery options.';
        this.toastr.error(
          getHttpErrorMessage(error, 'We could not load the delivery options.'),
          'Delivery',
        );
      },
    });
  }

  SetShippingPrice(): void {
    const selected = this.deliveries.find(
      (item) => item.id === Number(this.delivery.value.delivery),
    );
    this.basketService.SetShippingPrice(selected);
  }
}
