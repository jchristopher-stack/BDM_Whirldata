import { Component, Input } from '@angular/core';

/**
 * Frame for the signed-out screens (sign in, activation, set/forgot/reset password):
 * brand at the top, the page's form in the middle, an optional footer line
 * (`<div authFooter>`), and the photo panel on the right on wide screens.
 * Styles live in src/styles/_auth.scss so the projected forms can use them too.
 */
@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.component.html'
})
export class AuthLayoutComponent {
  /** Line under the TAAP name; empty hides it (the reset page also serves app users). */
  @Input() product = 'Therapist Portal';
}
