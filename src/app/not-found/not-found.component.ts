import { Component } from '@angular/core';
import { Location } from '@angular/common';

/** Shown for any URL that doesn't match a route. */
@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.css']
})
export class NotFoundComponent {
  constructor(public location: Location) { }
}
