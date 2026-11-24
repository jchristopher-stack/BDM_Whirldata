import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';

export const APP_NAME = 'TAAP Therapist Portal';

/** Sets the browser tab title as "<page> · TAAP Therapist Portal". */
@Injectable({
  providedIn: 'root'
})
export class PageTitleService {

  constructor(private title: Title) { }

  set(pageTitle?: string) {
    this.title.setTitle(pageTitle ? `${pageTitle} · ${APP_NAME}` : APP_NAME);
  }
}
