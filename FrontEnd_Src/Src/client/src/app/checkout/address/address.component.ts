import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { IShippingAddress } from '../../shared/Models/Order/orderModels';
import { getHttpErrorMessage } from '../../shared/utils/http-error.util';
import { CheckoutService } from '../checkout.service';

@Component({
  selector: 'app-address',
  standalone: false,
  templateUrl: './address.component.html',
  styleUrl: './address.component.scss',
})
export class AddressComponent implements OnInit {
  @Input({ required: true }) address!: FormGroup;

  canEdit = false;
  isLoading = false;

  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.checkoutService.getAddress().subscribe({
      next: (response) => {
        this.address.patchValue(response?.data ?? {});
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        // 404 simply means the user has not saved an address yet. Start in edit mode so
        // the required fields can be filled instead of leaving a read-only empty form.
        if (error.status === 404) {
          this.canEdit = true;
        } else {
          this.toastr.error(
            getHttpErrorMessage(error, 'We could not load your saved address.'),
            'Address',
          );
        }
      },
    });
  }

  toggleEdit(): void {
    this.canEdit = !this.canEdit;
    if (this.canEdit) {
      this.address.markAsUntouched();
    }
  }

  UpdateAddress(): void {
    if (this.address.invalid) {
      this.address.markAllAsTouched();
      this.toastr.warning('Please fill in all address fields.', 'Address');
      return;
    }

    this.checkoutService
      .updateAddress(this.address.getRawValue() as IShippingAddress)
      .subscribe({
        next: () => {
          this.toastr.success('Address updated.', 'Address');
          this.canEdit = false;
        },
        error: (error) => {
          this.toastr.error(
            getHttpErrorMessage(error, 'We could not save your address. Please try again.'),
            'Address',
          );
        },
      });
  }

  isInvalid(controlName: string): boolean {
    const control = this.address.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  errorFor(controlName: string): string {
    const control = this.address.get(controlName);
    if (!control) return '';
    if (control.hasError('required')) return 'This field is required.';
    if (control.hasError('whitespace')) return 'This field cannot be only spaces.';
    return 'Please check this field.';
  }
}
