import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { MatterEvent } from '../../../appTypes';

@Component({
  selector: 'app-event-details-dialog',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './event-details-dialog.html',
  styles: ``,
})
export class EventDetailsDialog {
  @Input() event!: MatterEvent | null;
  @Input() typeLabel: string = '';
  @Input() statusLabel: string = '';

  @Output() closeDialog = new EventEmitter<void>();

  onClose() {
    this.closeDialog.emit();
  }
}
