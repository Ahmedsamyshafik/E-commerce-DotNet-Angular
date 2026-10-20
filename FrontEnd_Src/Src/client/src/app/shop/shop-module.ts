import { NgModule } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ShopComponent } from './shop.component';
import { ShopItemComponent } from './shop-item/shop-item.component';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { SharedModule } from '../shared/shared.module';
import { RouterModule } from '@angular/router';
import { NgxImageZoomModule } from 'ngx-image-zoom';
import { ShopRoutingModule } from './shop-routing-module';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [ShopComponent, ShopItemComponent, ProductDetailsComponent],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule,
    ShopRoutingModule,
    NgxImageZoomModule,
    CurrencyPipe,
    FormsModule,
  ],
  exports: [],
})
export class ShopModule {}
