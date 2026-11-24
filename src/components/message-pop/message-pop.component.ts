import { Component } from '@angular/core';
import { MessageService } from 'primeng/api';
import { MessagePopService, MessagePopConstants, MessagePopConfig } from "./message-pop.service";

const SEVERITY: { [status: string]: string } = {
  [MessagePopConstants.SUCCESS]: 'success',
  [MessagePopConstants.FAILURE]: 'error',
  [MessagePopConstants.INFO]: 'info',
};

/**
 * Shows app-wide messages (API results, and checks that aren't tied to one
 * form field) as a single PrimeNG toast. Errors stay up longer than successes.
 */
@Component({
  selector: 'app-message-pop',
  templateUrl: './message-pop.component.html',
  styleUrls: ['./message-pop.component.css']
})
export class MessagePopComponent {

  constructor(private messagePopService: MessagePopService, private messageService: MessageService) {
    this.messagePopService.notifySubject.subscribe((data: any) => {
      this.notifyMessage(data);
    });
  }

  notifyMessage(messageConfig: MessagePopConfig) {
    if (!messageConfig.message?.toString().trim()) {
      return;
    }
    const severity = SEVERITY[messageConfig.status] || 'info';
    this.messageService.add({
      key: 'app',
      severity: severity,
      detail: messageConfig.message,
      life: messageConfig.timeDelay || (severity == 'error' ? 6000 : 3500),
    });
  }
}
