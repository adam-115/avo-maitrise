import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceTimeEntry } from '../../appTypes';

export interface SelectableTimeEntry {
  entry: InvoiceTimeEntry;
  selected: boolean;
  disabled: boolean;
}

@Component({
  selector: 'app-generate-invoice-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './generate-invoice-dialog.html'
})
export class GenerateInvoiceDialog implements OnChanges {
  @Input() generatedTimeEntries: InvoiceTimeEntry[] = [];
  
  @Output() closeDialog = new EventEmitter<void>();
  @Output() confirmGeneration = new EventEmitter<InvoiceTimeEntry[]>();

  selectableEntries: SelectableTimeEntry[] = [];
  vatRate: number = 20;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['generatedTimeEntries'] && changes['generatedTimeEntries'].currentValue) {
      this.selectableEntries = this.generatedTimeEntries.map(entry => {
        const statusCode = entry.invoiceDossierService?.invoiceDossierServieStatus?.code;
        const isEligible = statusCode === 'EN_ATTENTE' || statusCode === 'REPORTED';
        
        return {
          entry,
          selected: isEligible,
          disabled: !isEligible
        };
      });
    }
  }

  get totalHT(): number {
    return this.selectableEntries
      .filter(item => item.selected)
      .reduce((sum, item) => {
        const minutes = item.entry.nbrOfMinutes || 0;
        const price = item.entry.price5min || 0;
        return sum + ((minutes / 5) * price);
      }, 0);
  }

  get totalTTC(): number {
    const ht = this.totalHT;
    return ht + (ht * (this.vatRate / 100));
  }

  onClose(): void {
    this.closeDialog.emit();
  }

  onConfirm(): void {
    const selectedItems = this.selectableEntries
      .filter(item => item.selected)
      .map(item => item.entry);
    this.confirmGeneration.emit(selectedItems);
  }
}
