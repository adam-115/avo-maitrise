import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Client } from '../../appTypes';
import { ClientService } from '../../services/client-service';
import { DossierService } from '../../services/dossier.service';

@Component({
    selector: 'app-client-selection-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe],
    templateUrl: './client-selection-dialog.html',
    styleUrl: './client-selection-dialog.css'
})
export class ClientSelectionDialog implements OnInit {
    @Input() initialSelection: string | number | null = null;
    @Input() currentAutresParties: any[] = [];
    @Output() confirmSelection = new EventEmitter<Client>();
    @Output() closeDialog = new EventEmitter<void>();

    private readonly clientService = inject(ClientService);
    private readonly dossierService = inject(DossierService);

    filteredClients: Client[] = [];
    totalElements = 0;
    selectedClientId: string | number | null = null;
    searchTerm: string = '';
    loading = false;

    // Conflict Check
    hasConflict = false;
    conflictMessage = '';

    // Pagination
    currentPage = 1;
    pageSize = 5;

    getDisplayName(client: any): string {
        if (!client) return '';
        return `${client.nom || client.nomCommercial || ''} ${client.prenom || ''}`.trim();
    }

    ngOnInit(): void {
        this.selectedClientId = this.initialSelection;
        this.currentPage = 1;
        this.loadClients();
    }

    loadClients(): void {
        this.loading = true;
        const filters = {
            searchTerm: this.searchTerm
        };
        this.clientService.findAll(this.currentPage - 1, this.pageSize, 'createdAt,desc', filters).subscribe({
            next: (res) => {
                this.filteredClients = res.content || [];
                this.totalElements = res.totalElements;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading clients in dialog', err);
                this.loading = false;
            }
        });
    }

    filterClients(): void {
        this.currentPage = 1;
        this.loadClients();
    }

    get totalPages(): number {
        return Math.ceil(this.totalElements / this.pageSize) || 1;
    }

    get paginatedClients(): Client[] {
        return this.filteredClients;
    }

    get currentEndIndex(): number {
        return Math.min(this.currentPage * this.pageSize, this.totalElements);
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadClients();
        }
    }

    prevPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadClients();
        }
    }

    selectClient(clientId: string | number): void {
        this.selectedClientId = clientId;
        this.hasConflict = false;
        this.conflictMessage = '';

        // 1. Check local conflicts first
        const existingPartie = this.currentAutresParties.find(p => String(p.partie.id) === String(clientId));
        if (existingPartie) {
            this.hasConflict = true;
            this.conflictMessage = `Conflit direct : Ce contact est déjà ajouté comme ${existingPartie.role}.`;
            return;
        }

        // 2. Check backend conflicts
        this.dossierService.checkConflict(Number(clientId)).subscribe({
            next: (res) => {
                if (res && res.hasConflict) {
                    this.hasConflict = true;
                    this.conflictMessage = res.message || 'Attention : Un conflit d\'intérêt a été détecté pour ce client.';
                }
            },
            error: (err) => console.error('Error checking conflict', err)
        });
    }

    isSelected(clientId: string | number): boolean {
        return String(this.selectedClientId) === String(clientId);
    }

    onConfirm(): void {
        if (this.selectedClientId) {
            const selectedClient = this.filteredClients.find(c => String(c.id) === String(this.selectedClientId));
            if (selectedClient) {
                this.confirmSelection.emit(selectedClient);
            }
        }
    }

    onCancel(): void {
        this.closeDialog.emit();
    }
}
