import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BasketService } from '../../basket/basket.service';
import { ILoginModel } from '../../shared/Models/Account/LoginModel';
import { getHttpErrorMessage } from '../../shared/utils/http-error.util';
import { IdentityService } from '../identity.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  formGroup!: FormGroup;
  emailModel = '';
  isSubmitting = false;
  isSendingReset = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly identityService: IdentityService,
    private readonly toastr: ToastrService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly basket: BasketService,
  ) {}

  ngOnInit(): void {
    this.ValidationForm();
  }

  ValidationForm(): void {
    this.formGroup = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  submit(): void {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const loginObj: ILoginModel = this.formGroup.getRawValue();
    this.isSubmitting = true;

    this.identityService.Login(loginObj).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        const user = response?.data;
        if (!user?.id) {
          this.toastr.error('We could not complete the sign in. Please try again.', 'Sign in');
          return;
        }

        localStorage.setItem('userId', user.id);
        this.toastr.success(
          user.displayName ? `Welcome back, ${user.displayName}.` : 'Signed in successfully.',
          'Sign in',
        );

        // Load the signed-in user's server cart (the guest-cart merge is backend-owned).
        this.basket.GetBasket().subscribe();

        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const safeReturnUrl =
          returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')
            ? returnUrl
            : '/';
        this.router.navigateByUrl(safeReturnUrl);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.toastr.error(
          getHttpErrorMessage(error, 'Sign in failed. Please check your email and password.'),
          'Sign in',
        );
      },
    });
  }

  SendEmailForgetpassword(): void {
    const email = this.emailModel.trim();

    if (!EMAIL_PATTERN.test(email)) {
      this.toastr.warning('Please enter a valid email address.', 'Password reset');
      return;
    }

    this.isSendingReset = true;
    this.identityService.ForgetPassword(email).subscribe({
      // Same response for success and failure to avoid revealing registered emails.
      next: () => this.finishPasswordResetRequest(),
      error: () => this.finishPasswordResetRequest(),
    });
  }

  private finishPasswordResetRequest(): void {
    this.isSendingReset = false;
    this.toastr.success(
      'If that email is registered, a password reset link has been sent.',
      'Password reset',
    );
    this.emailModel = '';
  }

  get _email() {
    return this.formGroup.get('email')!;
  }

  get _password() {
    return this.formGroup.get('password')!;
  }
}
