import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';
import { BasketService } from '../../basket/basket.service';
import { IProductDetails } from '../../shared/Models/Product/productDetails';
import { ShopService } from '../shop.service';

const MAX_QUANTITY = 10;

@Component({
  selector: 'app-product-details',
  standalone: false,
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss',
})
export class ProductDetailsComponent implements OnInit {
  readonly imageBaseUrl = environment.BASEURLFROMIMGS;

  product: IProductDetails | null = null;
  mainImage = '';
  quantity = 1;
  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly shopService: ShopService,
    private readonly basketService: BasketService,
    private readonly route: ActivatedRoute,
    private readonly toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.loadProduct();
  }

  loadProduct(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'Product not found.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.shopService.getProductById(id).subscribe({
      next: (response) => {
        const product = response?.data ?? null;
        if (!product) {
          this.isLoading = false;
          this.errorMessage = 'Product not found.';
          return;
        }
        this.product = product;
        this.mainImage = product.photoUrls?.length
          ? this.imageBaseUrl + product.photoUrls[0].url
          : '';
        this.quantity = 1;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'We could not load this product. Please try again.';
        this.toastr.error(this.errorMessage, 'Product');
      },
    });
  }

  ReplaceMainImage(url: string): void {
    this.mainImage = this.imageBaseUrl + url;
  }

  incrementBasket(): void {
    if (this.quantity < MAX_QUANTITY) {
      this.quantity++;
    }
  }

  decrementBasket(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  onQuantityChange(value: number | string): void {
    this.quantity = this.normalizeQuantity(value);
  }

  AddToBasket(): void {
    if (!this.product) {
      return;
    }

    const quantity = this.normalizeQuantity(this.quantity);
    this.quantity = quantity;

    this.basketService
      .SetBasket({ productId: this.product.id, Quentity: quantity })
      .subscribe((result) => {
        if (result) {
          this.toastr.success('Item added to your cart.', 'Cart');
        }
      });
  }

  private normalizeQuantity(value: number | string): number {
    const parsed = Math.floor(Number(value));
    if (!Number.isFinite(parsed)) {
      return 1;
    }
    return Math.min(MAX_QUANTITY, Math.max(1, parsed));
  }
}
