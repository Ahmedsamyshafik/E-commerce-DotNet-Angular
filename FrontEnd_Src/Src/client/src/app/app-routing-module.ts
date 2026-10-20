import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { authGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'shop',
    loadChildren: () => import('./shop/shop-module').then((m) => m.ShopModule),
  },
  // The API redirects back with exact casing; Angular route matching is case-sensitive.
  { path: 'Shop', redirectTo: 'shop', pathMatch: 'full' },
  {
    path: 'checkout',
    loadChildren: () => import('./checkout/checkout-module').then((m) => m.CheckoutModule),
    canActivate: [authGuard],
  },
  {
    path: 'account',
    loadChildren: () => import('./identity/identity-module').then((m) => m.IdentityModule),
  },
  {
    path: 'basket',
    loadChildren: () => import('./basket/basket-module').then((m) => m.BasketModule),
  },
  {
    path: 'Success',
    loadComponent: () =>
      import('./checkout/payment-success/payment-success.component').then(
        (m) => m.PaymentSuccessComponent,
      ),
  },
  { path: 'success', redirectTo: 'Success', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
