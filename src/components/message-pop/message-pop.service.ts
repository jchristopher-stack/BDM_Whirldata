import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MessagePopService {
  public notifySubject = new Subject();

  constructor() {
  }

}

export const MessagePopConstants = {
  SUCCESS: "alert-success",
  FAILURE: "alert-danger",
  INFO: "alert-info",
};

export interface MessagePopConfig {
  message: string;
  status: string;
  timeDelay?: number;
}