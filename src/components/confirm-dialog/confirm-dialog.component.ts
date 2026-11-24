import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * The one confirm dialog for the app. Buttons are always [Cancel] [Confirm],
 * right-aligned; set `danger` for destructive actions. Closing with the X or
 * Escape emits neither `confirm` nor `cancel`.
 */
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css']
})
export class ConfirmDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() header = '';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() danger = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
    this.close();
  }

  onCancel() {
    this.cancel.emit();
    this.close();
  }

  private close() {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
