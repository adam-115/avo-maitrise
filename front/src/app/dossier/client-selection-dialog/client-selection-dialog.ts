import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Client } from '../../appTypes';

@Component({
    selector: 'app-client-selection-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './client-selection-dialog.html',
    styleUrl: './client-selection-dialog.css'
})
export class ClientSelectionDialog implements OnInit {
    @Input() clients: Client[] = [];
    @Input() initialSelection: string | number | null = null;
    @Output() confirmSelection = new EventEmitter<string | number>();
    @Output() closeDialog = new EventEmitter<void>();

    filteredClients: Client[] = [];
    selectedClientId: string | number | null = null;
    searchTerm: string = '';

    ngOnInit(): void {
        this.filteredClients = [...this.clients];
        this.selectedClientId = this.initialSelection;
    }

    filterClients(): void {
        if (!this.searchTerm) {
            this.filteredClients = [...this.clients];
        } else {
            const lowerTerm = this.searchTerm.toLowerCase();
            this.filteredClients = this.clients.filter(client =>
                (client.nom && client.nom.toLowerCase().includes(lowerTerm)) ||
                (client.prenom && client.prenom.toLowerCase().includes(lowerTerm)) ||
                (client.email && client.email.toLowerCase().includes(lowerTerm))
            );
        }
    }

    selectClient(clientId: string | number): void {
        this.selectedClientId = clientId;
    }

    isSelected(clientId: string | number): boolean {
        return String(this.selectedClientId) === String(clientId);
    }

    onConfirm(): void {
        if (this.selectedClientId) {
            this.confirmSelection.emit(this.selectedClientId);
        }
    }

    onCancel(): void {
        this.closeDialog.emit();
    }
}
