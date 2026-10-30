import { Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BasketService } from '../../basket/basket.service';
import { AuthService } from '../services/auth.service';

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
  isSignedIn = false;
  userName = '';

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly basketService: BasketService,
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.basketService.basket$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((basket) => {
        this.count = basket?.items?.length ?? 0;
      });

    this.auth.user$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.isSignedIn = !!user;
        this.userName = user?.displayName || user?.userName || '';
      });

    // Validate the cookie once, then load the basket it belongs to. Guests get their
    // server-issued guest cookie from this same call, so the cart works before login.
    this.auth
      .loadCurrentUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.basketService.GetBasket().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
      });
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  /** Signs out on the server, clears the local hints and returns to guest mode. */
  logout(): void {
    this.auth.logout().subscribe({
      complete: () => {
        this.basketService.ClearLocalBasket();
        this.basketService.clearGuestCartId();
        this.basketService.GetBasket().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
        this.closeMenu();
        this.toastr.info('You have been signed out.', 'Signed out');
        this.router.navigateByUrl('/');
      },
    });
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
