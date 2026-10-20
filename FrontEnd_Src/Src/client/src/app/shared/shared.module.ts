import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { PaginationComponent } from './Component/pagination/pagination.component';
import { OrderTotalComponent } from './Component/order-total/order-total.component';



@NgModule({
  declarations: [
    PaginationComponent,
    OrderTotalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    PaginationModule
  ],
  exports: [
    CommonModule,
    PaginationModule,
    PaginationComponent,
    OrderTotalComponent
  ]
})
export class SharedModule { }
