import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { ServiceManagerService } from './service-manager.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private cookieService: CookieService) {}

  /**
   * Determines whether authenticated is
   * @returns true if authenticated 
   */
  isAuthenticated(): boolean {
    var token = this.cookieService.get("idToken")
    return Boolean(token)
  }
}
