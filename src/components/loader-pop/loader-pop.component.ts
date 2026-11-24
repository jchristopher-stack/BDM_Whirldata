import { Component, ElementRef, OnInit } from '@angular/core';

import { LoaderPopConfig, LoaderPopService } from './loader-pop.service';

/** Wait this long before blocking the screen, so quick saves never flash the spinner. */
const SHOW_DELAY_MS = 300;

/**
 * Blocking spinner for actions that change data (save, delete, sign in).
 * Screens that are only loading data show skeletons instead (app-skeleton).
 */
@Component({
  selector: 'app-loader-pop',
  templateUrl: './loader-pop.component.html',
  styleUrls: ['./loader-pop.component.css']
})
export class LoaderPopComponent implements OnInit {
  pendingActionsCount: number = 0;
  private showTimer: any = null;

  constructor(private loaderPopService: LoaderPopService, private elementRef: ElementRef) {
    this.loaderPopService.notifySubject.subscribe((data: any) => {
      this.notifyLoader(data);
    });
  }

  ngOnInit(): void {  }

  notifyLoader(config: LoaderPopConfig) {
    if (config.createAction) {
      this.pendingActionsCount++;
    // the extra check for > 0, to avoid getting into a situation where pendingActionsCount goes into negative.
    } else if (this.pendingActionsCount > 0) {
      this.pendingActionsCount--;
    }
    if (this.pendingActionsCount > 0) {
      if (!this.showTimer) {
        this.showTimer = setTimeout(() => {
          this.showTimer = null;
          this.setActive(this.pendingActionsCount > 0);
        }, SHOW_DELAY_MS);
      }
    } else {
      clearTimeout(this.showTimer);
      this.showTimer = null;
      this.setActive(false);
    }
  }

  // Toggled directly on the host: requests start and finish in the middle of
  // other components' change detection, so a template binding would throw.
  private setActive(active: boolean) {
    this.elementRef.nativeElement.classList.toggle('is-active', active);
  }
}
