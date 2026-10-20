import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { getHttpErrorMessage } from '../../shared/utils/http-error.util';
import { noWhitespaceValidator } from '../../shared/validators/no-whitespace.validator';
import { IdentityService } from '../identity.service';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
  formGroup!: FormGroup;
  isSubmitting = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly identityService: IdentityService,
    private readonly toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.FormValidation();
  }

  FormValidation(): void {
    this.formGroup = this.fb.group({
      UserName: [
        '',
        [Validators.required, Validators.minLength(6), Validators.pattern(/^\S+$/)],
      ],
      email: ['', [Validators.required, Validators.email]],
      DisplayName: ['', [Validators.required, noWhitespaceValidator]],
      password: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
          ),
        ],
      ],
    });
  }

  submit(): void {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const form = this.formGroup.getRawValue();
    this.isSubmitting = true;

    this.identityService
      .register({
        displayName: form.DisplayName,
        email: form.email,
        password: form.password,
        userName: form.UserName,
      })
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toastr.success(
            'Account created. Check your email to activate it.',
            'Register',
          );
        },
        error: (error) => {
          this.isSubmitting = false;
          this.toastr.error(
            getHttpErrorMessage(error, 'Registration failed. Please try again.'),
            'Register',
          );
        },
      });
  }

  get _username() {
    return this.formGroup.get('UserName')!;
  }

  get _email() {
    return this.formGroup.get('email')!;
  }

  get _DisplayName() {
    return this.formGroup.get('DisplayName')!;
  }

  get _password() {
    return this.formGroup.get('password')!;
  }
}
