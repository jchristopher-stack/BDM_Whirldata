import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderPopService {
  public notifySubject = new Subject();
  constructor() { }

}

export interface LoaderPopConfig {
  createAction: boolean;
}
