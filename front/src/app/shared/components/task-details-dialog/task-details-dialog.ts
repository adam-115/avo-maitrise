import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Task } from '../../../appTypes';

@Component({
  selector: 'app-task-details-dialog',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './task-details-dialog.html',
  styles: ``,
})
export class TaskDetailsDialog {
  @Input() task!: Task | null;
  @Input() categoryLabel!: string;
  @Input() statusLabel: string = "";

  @Output() closeDialog = new EventEmitter<void>();

  onClose() {
    this.closeDialog.emit();
  }

  formatMinutesToHours(minutes?: number): string {
    if (!minutes) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m > 0 ? m + 'm' : ''}`.trim();
  }
}
