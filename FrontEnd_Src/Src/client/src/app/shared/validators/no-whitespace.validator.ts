import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Rejects values that are empty or made only of whitespace.
 * Use together with `Validators.required` so `null`/empty is reported as `required`.
 */
export const noWhitespaceValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;
  if (typeof value !== 'string') {
    return null;
  }
  return value.trim().length === 0 ? { whitespace: true } : null;
};
