import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { Observable } from "rxjs";
import { AuthService } from "./auth.service";

@Injectable({
    providedIn: 'root'
})

export class AuthGuard implements CanActivate {
    constructor(
        private auth: AuthService,
        private router: Router,
    ) {}

    
    /**
     * Determines whether activate can
     * @param route 
     * @param state 
     * @returns activate 
     */
    canActivate(route: ActivatedRouteSnapshot, 
        state: RouterStateSnapshot)
        : boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
        if (this.auth.isAuthenticated()) {
            return true;
        } else {
            this.router.navigate(['/sign-in']);
            return false;
        }
    }
}