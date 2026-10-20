import { Component, Input, OnInit } from '@angular/core';
import { Iproduct } from '../../shared/Models/Pagination/product';
import { BasketService } from '../../basket/basket.service';
import { IAddBasket } from '../../shared/Models/Basket/Basket';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-shop-item',
  standalone: false,
  templateUrl: './shop-item.component.html',
  styleUrl: './shop-item.component.scss',
})
export class ShopItemComponent implements OnInit {
  readonly baseUrl = environment.BASEURLFROMIMGS;

  @Input({ required: true }) Product!: Iproduct;

  constructor(
    private readonly basketService: BasketService,
    private readonly toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    // Data is supplied by the parent list component.
  }

  SetBasketValue(): void {
    const basket: IAddBasket = {
      productId: this.Product.id,
      Quentity: 1,
    };

    this.basketService.SetBasket(basket).subscribe((result) => {
      if (result) {
        this.toastr.success('Item added to your cart.', 'Cart');
      }
    });
  }
}
