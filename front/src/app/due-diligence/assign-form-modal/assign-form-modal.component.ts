import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormConfig } from '../../appTypes';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-assign-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assign-form-modal.component.html',
})
export class AssignFormModalComponent {
  @Input() availableForms: FormConfig[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() assign = new EventEmitter<string>();

  selectedFormId: string = '';

  onClose() {
    this.close.emit();
  }

  onAssign() {
    if (this.selectedFormId) {
      this.assign.emit(this.selectedFormId);
    }
  }

  selectForm(id: string) {
    this.selectedFormId = id;
  }
}
