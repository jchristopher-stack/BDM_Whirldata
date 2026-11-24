import { Component, ElementRef, forwardRef, Input, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { COUNTRIES, Country, PREFERRED_ISO_FOR_DIAL_CODE } from 'src/constants/countries';

export const DEFAULT_COUNTRY_ISO = 'IN';
// Shown above the A-Z list when nothing has been typed in the search box.
const PINNED_ISO = ['IN'];

export function countryForDialCode(dialCode: string): Country | undefined {
  const preferred = PREFERRED_ISO_FOR_DIAL_CODE[dialCode];
  return COUNTRIES.find(c => c.iso === preferred && c.dial_code === dialCode)
    || COUNTRIES.find(c => c.dial_code === dialCode);
}

/**
 * Splits a stored number ("+91-9841078381") into its country and digits. Also
 * copes with older values: extra formatting hyphens ("+91-984-107-8381"), no
 * separator ("+919841078381") and no country code at all ("9841078381").
 */
export function parsePhoneNumber(value: any): { country: Country, digits: string } {
  const raw = String(value || '').trim();
  const fallback = COUNTRIES.find(c => c.iso === DEFAULT_COUNTRY_ISO) as Country;
  if (!raw.startsWith('+')) {
    return { country: fallback, digits: raw.replace(/\D/g, '') };
  }
  let dialCode = '';
  let rest = '';
  const separator = raw.search(/[-\s]/);
  if (separator > 0) {
    dialCode = raw.slice(0, separator);
    rest = raw.slice(separator + 1);
  } else {
    const allDigits = raw.replace(/\D/g, '');
    const match = COUNTRIES
      .filter(c => allDigits.startsWith(c.dial_code.slice(1)))
      .sort((a, b) => b.dial_code.length - a.dial_code.length)[0];
    dialCode = match ? match.dial_code : '';
    rest = allDigits.slice(Math.max(dialCode.length - 1, 0));
  }
  return { country: countryForDialCode(dialCode) || fallback, digits: rest.replace(/\D/g, '') };
}

export function maxPhoneDigits(country: Country): number {
  // E.164 allows 15 digits including the country code.
  return 15 - (country.dial_code.length - 1);
}

/** Returns a message for an invalid number, or null when it's fine. */
export function phoneNumberError(value: any): string | null {
  if (!value) {
    return 'Please enter a phone number.';
  }
  const { country, digits } = parsePhoneNumber(value);
  if (country.iso === 'IN' && digits.length !== 10) {
    return 'Indian phone numbers have 10 digits.';
  }
  const max = maxPhoneDigits(country);
  if (digits.length < 4 || digits.length > max) {
    return `Phone number should have 4 to ${max} digits.`;
  }
  return null;
}

let nextPhoneInputId = 0;

/**
 * Phone number field with a searchable country picker. Bind it with ngModel; the
 * value is "+<dial code>-<digits>" (e.g. "+91-9841078381"), or "" while no digits
 * are entered. That one-hyphen format is what the client app expects.
 */
@Component({
  selector: 'app-phone-input',
  templateUrl: './phone-input.component.html',
  styleUrls: ['./phone-input.component.css'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => PhoneInputComponent),
    multi: true
  }]
})
export class PhoneInputComponent implements ControlValueAccessor {
  @Input() label = 'Phone number';
  @Input() required = false;
  /** Inline error to show under the field; null when the number is fine. */
  @Input() error: string | null = null;
  /** id for the number input, so a page can point a label or focus at it. */
  @Input() inputId = `phone-input-${nextPhoneInputId++}`;
  @ViewChild('trigger') trigger!: ElementRef<HTMLButtonElement>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('phoneInput') phoneInput!: ElementRef<HTMLInputElement>;
  @ViewChild('optionList') optionList!: ElementRef<HTMLElement>;

  country: Country = parsePhoneNumber('').country;
  digits = '';
  disabled = false;
  isOpen = false;
  query = '';
  results: Country[] = [];
  pinnedCount = 0;
  activeIndex = 0;
  positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 }
  ];

  private onChange = (_: any) => {};
  private onTouched = () => {};

  writeValue(value: any): void {
    const parsed = parsePhoneNumber(value);
    this.country = parsed.country;
    this.digits = parsed.digits;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.isOpen = false;
    }
  }

  get maxDigits(): number {
    return maxPhoneDigits(this.country);
  }

  isSelected(country: Country): boolean {
    return country.iso === this.country.iso && country.dial_code === this.country.dial_code;
  }

  toggle(): void {
    this.isOpen ? this.close() : this.open();
  }

  open(): void {
    if (this.disabled) {
      return;
    }
    this.query = '';
    this.refreshResults();
    this.activeIndex = Math.max(this.results.findIndex(c => this.isSelected(c)), 0);
    this.isOpen = true;
    setTimeout(() => {
      this.searchInput?.nativeElement.focus();
      this.scrollActiveIntoView();
    });
  }

  close(focusTrigger = false): void {
    if (!this.isOpen) {
      return;
    }
    this.isOpen = false;
    this.onTouched();
    if (focusTrigger) {
      setTimeout(() => this.trigger?.nativeElement.focus());
    }
  }

  onOutsideClick(event: MouseEvent): void {
    // A click on the trigger is handled by toggle(); closing here too would reopen it.
    if (this.trigger?.nativeElement.contains(event.target as Node)) {
      return;
    }
    this.close();
  }

  onSearch(event: Event): void {
    this.query = (event.target as HTMLInputElement).value;
    this.refreshResults();
    this.activeIndex = 0;
    if (this.optionList) {
      this.optionList.nativeElement.scrollTop = 0;
    }
  }

  /** Matches country name, alias, ISO code ("IN") and dial code ("+91" or "91"). */
  refreshResults(): void {
    const term = this.query.trim().toLowerCase();
    if (!term) {
      const pinned = PINNED_ISO
        .map(iso => COUNTRIES.find(c => c.iso === iso))
        .filter(c => !!c) as Country[];
      this.pinnedCount = pinned.length;
      this.results = [...pinned, ...COUNTRIES.filter(c => !PINNED_ISO.includes(c.iso))];
      return;
    }
    this.pinnedCount = 0;
    const digits = term.replace(/^\+/, '');
    const isDialSearch = /^\d+$/.test(digits);
    const rank = (c: Country): number => {
      const names = [c.name, ...(c.aliases || [])].map(n => n.toLowerCase());
      if (isDialSearch) {
        const code = c.dial_code.slice(1);
        return code === digits ? 0 : code.startsWith(digits) ? 1 : -1;
      }
      if (c.iso.toLowerCase() === term) return 0;
      if (names.some(n => n.startsWith(term))) return 1;
      if (names.some(n => n.includes(term))) return 2;
      return -1;
    };
    this.results = COUNTRIES
      .map(c => ({ c, r: rank(c) }))
      .filter(x => x.r >= 0)
      .sort((a, b) => a.r - b.r)
      .map(x => x.c);
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.open();
    }
  }

  onPanelKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex = Math.min(this.activeIndex + 1, this.results.length - 1);
        this.scrollActiveIntoView();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex = Math.max(this.activeIndex - 1, 0);
        this.scrollActiveIntoView();
        break;
      case 'Enter':
        event.preventDefault();
        if (this.results[this.activeIndex]) {
          this.choose(this.results[this.activeIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.close(true);
        break;
      case 'Tab':
        this.close();
        break;
    }
  }

  choose(country: Country): void {
    this.country = country;
    this.isOpen = false;
    this.onTouched();
    this.emit();
    setTimeout(() => this.phoneInput?.nativeElement.focus());
  }

  onDigitsInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Digits only: letters, spaces and hyphens (typed or pasted) are dropped.
    const cleaned = input.value.replace(/\D/g, '').slice(0, this.maxDigits);
    if (cleaned !== input.value) {
      input.value = cleaned;
    }
    this.digits = cleaned;
    this.emit();
  }

  private emit(): void {
    this.onChange(this.digits ? `${this.country.dial_code}-${this.digits}` : '');
  }

  private scrollActiveIntoView(): void {
    setTimeout(() => {
      const active = this.optionList?.nativeElement.querySelector('.phi-option.phi-active');
      (active as HTMLElement | null)?.scrollIntoView({ block: 'nearest' });
    });
  }
}
