import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { IResetPasswordModel } from '../../shared/Models/Account/ActiveAccountModel';
import { getHttpErrorMessage } from '../../shared/utils/http-error.util';
import { IdentityService } from '../identity.service';

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  ResetModel: IResetPasswordModel = {
    code: '',
    email: '',
  };

  formGroup!: FormGroup;
  isSubmitting = false;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly activeRouter: ActivatedRoute,
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly identityService: IdentityService,
    private readonly toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.FormValidation();

    this.activeRouter.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.ResetModel.code = params['code'] ?? '';
        this.ResetModel.email = params['email'] ?? '';
      });

    this.formGroup.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.passwordMatchValidation());
  }

  FormValidation(): void {
    const passwordValidators = [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/),
    ];

    this.formGroup = this.fb.group({
      password: ['', passwordValidators],
      confirmPassword: ['', passwordValidators],
    });
  }

  Submit(): void {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    if (!this.ResetModel.email || !this.ResetModel.code) {
      this.toastr.error('This password reset link is invalid or incomplete.', 'Password reset');
      return;
    }

    const password = this.formGroup.get('password')?.value;
    this.isSubmitting = true;

    this.identityService
      .ResetPassword({
        Token: this.ResetModel.code,
        Email: this.ResetModel.email,
        password,
      })
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toastr.success('Password updated. Please sign in.', 'Password reset');
          this.router.navigate(['/account/login']);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.toastr.error(
            getHttpErrorMessage(
              error,
              'This reset link is invalid or has expired. Please request a new one.',
            ),
            'Password reset',
          );
        },
      });
  }

  passwordMatchValidation(): void {
    const pass = this._password?.value;
    const confirmPass = this._confirmPassword?.value;
    const errors = { ...(this._confirmPassword.errors ?? {}) };

    if (pass !== confirmPass) {
      this._confirmPassword.setErrors({ ...errors, passwordMismatch: true });
    } else {
      delete errors['passwordMismatch'];
      this._confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
    }
  }

  get _password() {
    return this.formGroup.get('password')!;
  }

  get _confirmPassword() {
    return this.formGroup.get('confirmPassword')!;
  }
}
