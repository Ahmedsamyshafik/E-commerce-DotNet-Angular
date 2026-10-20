import { Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { BasketService } from '../../basket/basket.service';

@Component({
  selector: 'app-nav-bar',
  standalone: false,
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss',
})
export class NavBarComponent implements OnInit {
  count = 0;
  isDropdownOpen = false;
  isMenuOpen = false;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly basketService: BasketService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.basketService.basket$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((basket) => {
        this.count = basket?.items?.length ?? 0;
      });

    if (this.basketService.isAuthenticated) {
      this.basketService.GetBasket().subscribe();
    }
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    if (!this.isMenuOpen) {
      this.isDropdownOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  closeMenu(): void {
    this.isMenuOpen = false;
    this.isDropdownOpen = false;
  }

  onSearch(event: Event, query: string): void {
    event.preventDefault();
    const value = (query ?? '').trim();
    this.router.navigate(['/shop'], value ? { queryParams: { search: value } } : {});
    this.closeMenu();
  }
}
