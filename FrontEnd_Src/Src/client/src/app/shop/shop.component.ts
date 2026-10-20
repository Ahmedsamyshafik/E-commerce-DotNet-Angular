import { Component, DestroyRef, ElementRef, OnInit, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BasketService } from '../basket/basket.service';
import { ICategory } from '../shared/Models/Pagination/category';
import { Iproduct } from '../shared/Models/Pagination/product';
import { ProductParam } from '../shared/Models/Product/ProductParam';
import { ShopService } from './shop.service';

const PENDING_ORDER_KEY = 'pendingOrderId';

@Component({
  selector: 'app-shop',
  standalone: false,
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss',
})
export class ShopComponent implements OnInit {
  readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('search');
  readonly sortSelected = viewChild<ElementRef<HTMLSelectElement>>('SortSelected');

  private readonly destroyRef = inject(DestroyRef);
  private readonly productParam = new ProductParam();

  categories: ICategory[] = [];
  products: Iproduct[] = [];
  totalCount = 0;
  isLoading = false;
  errorMessage = '';
  hasPendingOrder = false;
  sortingOptions = [
    { name: 'Default', value: '' },
    { name: 'Name', value: 'Name' },
    { name: 'Price (Low to High)', value: 'priceAsc' },
    { name: 'Price (High to Low)', value: 'priceDesc' },
  ];

  constructor(
    private readonly shopService: ShopService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toastr: ToastrService,
    private readonly basketService: BasketService,
  ) {}

  get ProductParam(): ProductParam {
    return this.productParam;
  }

  /** Only offer the saved order when the cart is empty; otherwise a new order will be created. */
  get showResumePayment(): boolean {
    return this.hasPendingOrder && !this.basketService.hasItems();
  }

  ngOnInit(): void {
    this.hasPendingOrder = this.getPendingOrderId() !== null;

    const initialSearch = this.route.snapshot.queryParamMap.get('search');
    if (initialSearch) {
      this.productParam.search = initialSearch;
    }

    this.getAllCategories();
    this.getAllProducts();

    // Keep the search box and grid in sync when the navbar routes to /shop?search=...
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const search = (params.get('search') ?? '').trim();
        if (search !== (this.productParam.search ?? '')) {
          this.productParam.search = search;
          this.productParam.pageNumber = 1;
          this.getAllProducts();
        }
      });
  }

  getAllProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.shopService.getProducts(this.productParam).subscribe({
      next: (response) => {
        const page = response?.data;
        this.products = page?.data ?? [];
        this.totalCount = page?.totalCount ?? 0;
        this.productParam.pageNumber = page?.pageNumber ?? 1;
        this.productParam.pageSize = page?.pageSize ?? this.productParam.pageSize;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.products = [];
        this.totalCount = 0;
        this.errorMessage = 'We could not load the products. Please try again.';
        this.toastr.error(this.errorMessage, 'Shop');
      },
    });
  }

  getAllCategories(): void {
    this.shopService.getCategories().subscribe({
      next: (response) => {
        this.categories = response?.data?.data ?? [];
      },
      error: () => {
        this.toastr.error('We could not load the categories.', 'Shop');
      },
    });
  }

  SelectedId(categoryId: number): void {
    this.productParam.categoryId = categoryId;
    this.productParam.pageNumber = 1;
    this.getAllProducts();
  }

  clearCategoryFilter(): void {
    this.productParam.categoryId = undefined;
    this.productParam.pageNumber = 1;
    this.getAllProducts();
  }

  SortingByPrice(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.productParam.sort_selected = value;
    this.productParam.sort_order = '';

    if (value === 'priceAsc') {
      this.productParam.sort_selected = 'Price';
      this.productParam.sort_order = 'asc';
    } else if (value === 'priceDesc') {
      this.productParam.sort_selected = 'Price';
      this.productParam.sort_order = 'desc';
    }

    this.productParam.pageNumber = 1;
    this.getAllProducts();
  }

  OnSearch(search: string): void {
    const value = (search ?? '').trim();

    if (value === (this.productParam.search ?? '')) {
      this.productParam.pageNumber = 1;
      this.getAllProducts();
      return;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: value ? { search: value } : {},
    });
  }

  ResetValue(): void {
    const sortElement = this.sortSelected()?.nativeElement;
    if (sortElement) {
      sortElement.value = '';
    }
    const searchElement = this.searchInput()?.nativeElement;
    if (searchElement) {
      searchElement.value = '';
    }

    this.productParam.search = '';
    this.productParam.categoryId = undefined;
    this.productParam.sort_selected = '';
    this.productParam.sort_order = '';
    this.productParam.pageNumber = 1;

    if (this.route.snapshot.queryParamMap.has('search')) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true,
      });
    }
    // The query-param subscription intentionally skips reloading when the value is
    // already empty, so reset always refreshes the grid explicitly.
    this.getAllProducts();
  }

  OnPageChanged(page: number): void {
    if (page === this.productParam.pageNumber) {
      return;
    }
    this.productParam.pageNumber = page;
    this.getAllProducts();
  }

  private getPendingOrderId(): number | null {
    const raw = sessionStorage.getItem(PENDING_ORDER_KEY);
    const orderId = raw ? Number(raw) : NaN;
    return Number.isInteger(orderId) && orderId > 0 ? orderId : null;
  }
}
