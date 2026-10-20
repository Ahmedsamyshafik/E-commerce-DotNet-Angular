import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { noWhitespaceValidator } from '../../shared/validators/no-whitespace.validator';

@Component({
  selector: 'app-stepper',
  standalone: false,
  templateUrl: './stepper.component.html',
  styleUrl: './stepper.component.scss',
})
export class StepperComponent {
  private readonly _formBuilder = inject(FormBuilder);

  Address = this._formBuilder.group({
    firstName: ['', [Validators.required, noWhitespaceValidator]],
    lastName: ['', [Validators.required, noWhitespaceValidator]],
    street: ['', [Validators.required, noWhitespaceValidator]],
    city: ['', [Validators.required, noWhitespaceValidator]],
    zipCode: ['', [Validators.required, noWhitespaceValidator]],
    state: ['', [Validators.required, noWhitespaceValidator]],
  });

  DeliveryMethod = this._formBuilder.group({
    delivery: ['', Validators.required],
  });
}
