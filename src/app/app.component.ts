import { Component } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { PageTitleService } from './page-title.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'therapist-dev';
  nonAuthorizedAPI = ["/sign-up","/sign-in", "/forgot-password",
                      "/reset-password", "/set-password", "privacy-policy", "/ui-preview"]
  /** Set by a route's `data.hideSidebar` (the 404 page). */
  hideSidebar = false;

  constructor(public router: Router, private route: ActivatedRoute, private pageTitle: PageTitleService){
    // Each route names its page in `data.title`; screens with a better title
    // (a client's name, say) set it again once their data loads.
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      const page = this.currentRoute()
      this.pageTitle.set(page.data['title'])
      this.hideSidebar = !!page.data['hideSidebar']
    })
  }

  /**
   * Shows side navbar
   * @returns  true or false based on current url to show sidebar.
   */
  showSideNavbar(){
    return !this.hideSidebar && !this.nonAuthorizedAPI.filter((e: any) => this.router.url.includes(e)).length
  }

  /**
   * Moves keyboard focus into the main area. A plain "#main-content" link
   * would go through the router (base href) and change the page instead.
   */
  skipToMain(event: Event){
    event.preventDefault()
    document.getElementById('main-content')?.focus()
  }

  /** The innermost active route, which carries the page's data. */
  private currentRoute(): ActivatedRouteSnapshot {
    let snapshot = this.route.snapshot
    while (snapshot.firstChild) {
      snapshot = snapshot.firstChild
    }
    return snapshot
  }
}
