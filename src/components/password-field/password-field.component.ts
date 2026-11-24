import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextPasswordFieldId = 0;

/**
 * Labelled password input with a show/hide button, an optional hint and an
 * inline error. Bind it with ngModel. `autocomplete` should be
 * "current-password" or "new-password" so password managers fill the right one.
 */
@Component({
  selector: 'app-password-field',
  templateUrl: './password-field.component.html',
  styleUrls: ['./password-field.component.css'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => PasswordFieldComponent),
    multi: true
  }]
})
export class PasswordFieldComponent implements ControlValueAccessor {
  @Input() label = 'Password';
  @Input() inputId = `password-field-${nextPasswordFieldId++}`;
  @Input() autocomplete: 'current-password' | 'new-password' = 'current-password';
  /** Shown under the field while there's no error (e.g. "At least 8 characters"). */
  @Input() hint: string | null = null;
  /** Inline error; null when the value is fine. */
  @Input() error: string | null = null;
  /** Enter pressed in the field (outside a <form>, where Enter doesn't submit by itself). */
  @Output() enter = new EventEmitter<void>();

  value = '';
  visible = false;
  disabled = false;

  private onChange = (_: any) => {};
  onTouched = () => {};

  get describedBy(): string | null {
    if (this.error) {
      return `${this.inputId}-error`;
    }
    return this.hint ? `${this.inputId}-hint` : null;
  }

  writeValue(value: any): void {
    this.value = value == null ? '' : String(value);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }

  onInput(event: Event): void {
    this.value = (event.target as HTMLInputElement).value;
    this.onChange(this.value);
  }

  toggleVisible(): void {
    this.visible = !this.visible;
  }
}
