import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';
import { IBasket, Item } from '../../shared/Models/Basket/Basket';
import { BasketService } from '../basket.service';

@Component({
  selector: 'app-basket',
  standalone: false,
  templateUrl: './basket.component.html',
  styleUrl: './basket.component.scss',
})
export class BasketComponent implements OnInit {
  basket: IBasket | null = null;
  readonly imageBaseUrl = environment.BASEURLFROMIMGS;

  private readonly destroyRef = inject(DestroyRef);

  constructor(private basketService: BasketService) {}

  ngOnInit(): void {
    this.basketService.basket$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((basket) => {
        this.basket = basket;
      });
  }

  increase(item: Item): void {
    this.basketService.Increase(item);
  }

  decrease(item: Item): void {
    this.basketService.Decrease(item);
  }

  remove(item: Item): void {
    this.basketService.Remove(item);
  }
}
