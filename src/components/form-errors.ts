/** Error messages keyed by field name. A field with no entry is valid. */
export type FieldErrors = { [field: string]: string };

/** Loose check that catches typos like a missing "@" or domain; the backend has the final say. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The message for a missing or malformed email address, or null when it looks fine. */
export function emailError(value: any): string | null {
  const email = String(value || '').trim();
  if (!email) {
    return 'Enter an email address.';
  }
  if (!EMAIL_PATTERN.test(email)) {
    return 'Enter a valid email address, like name@clinic.com.';
  }
  return null;
}

/** Same minimum as the client app (validations.dart: passwordLengthValidator). */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_HINT = `At least ${PASSWORD_MIN_LENGTH} characters.`;

/** The message for a missing or too-short new password, or null when it's fine. */
export function newPasswordError(value: any, blankMessage = 'Enter a password.'): string | null {
  const password = String(value || '').trim();
  if (!password) {
    return blankMessage;
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  return null;
}

/** True when the value is empty or only whitespace. */
export function isBlank(value: any): boolean {
  return !String(value ?? '').trim();
}

/**
 * Inline form errors for one form. Validate on submit with `set()`, clear a
 * field's error as soon as the user edits it with `clear()`.
 *
 * Fields read `errors.<field>` for the message, [class.p-invalid] and aria-invalid.
 */
export class FormErrors {
  errors: FieldErrors = {};

  /** Replaces the errors and focuses the first invalid field. Returns true when there are none. */
  set(errors: FieldErrors): boolean {
    this.errors = errors;
    if (Object.keys(errors).length) {
      focusFirstInvalidField();
      return false;
    }
    return true;
  }

  clear(field: string): void {
    delete this.errors[field];
  }

  reset(): void {
    this.errors = {};
  }
}

const FOCUSABLE = 'input, select, textarea, button, [tabindex]:not([tabindex="-1"])';

/**
 * Moves focus to the first field marked invalid, once its error has rendered.
 * PrimeNG dropdowns and calendars carry aria-invalid on their host element, so
 * focus goes to the input inside them.
 */
export function focusFirstInvalidField(): void {
  setTimeout(() => {
    const field = document.querySelector<HTMLElement>('[aria-invalid="true"]');
    const target = field?.matches(FOCUSABLE) ? field : field?.querySelector<HTMLElement>(FOCUSABLE);
    target?.focus();
  });
}
