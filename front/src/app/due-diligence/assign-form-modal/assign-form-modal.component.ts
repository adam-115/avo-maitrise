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
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 5;

  onSearchChange() {
    this.currentPage = 1;
  }

  get filteredForms(): FormConfig[] {
    if (!this.searchTerm.trim()) {
      return this.availableForms;
    }
    const term = this.searchTerm.toLowerCase().trim();
    return this.availableForms.filter(form => 
      form.title.toLowerCase().includes(term) || 
      (form.name && form.name.toLowerCase().includes(term)) ||
      (form.type && form.type.toLowerCase().includes(term))
    );
  }

  get totalPages(): number {
    return Math.ceil(this.filteredForms.length / this.pageSize);
  }

  get paginatedForms(): FormConfig[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredForms.slice(startIndex, startIndex + this.pageSize);
  }

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

  setPage(page: number) {
    this.currentPage = page;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
}
