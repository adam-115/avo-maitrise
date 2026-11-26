import { Component, EventEmitter, HostListener, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Client } from '../../appTypes';
import { ClientService } from '../../services/client-service';

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

    filteredClients: Client[] = [];
    totalElements = 0;
    selectedClientId: string | number | null = null;
    selectedClientObj: Client | null = null;
    searchTerm: string = '';
    loading = false;

    // Conflict Check
    hasConflict = false;
    conflictMessage = '';

    // Pagination
    currentPage = 1;
    pageSize = 6;

    @HostListener('document:keydown.escape')
    onEscapePress(): void {
        this.onCancel();
    }

    getDisplayName(client: any): string {
        if (!client) return '';
        return `${client.nom || client.nomCommercial || ''} ${client.prenom || ''}`.trim();
    }

    getInitials(client: any): string {
        const name = this.getDisplayName(client);
        if (!name) return 'CL';
        const parts = name.split(/\s+/);
        return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
    }

    ngOnInit(): void {
        this.selectedClientId = this.initialSelection;
        this.currentPage = 1;
        this.loadClients();
    }

    loadClients(): void {
        this.loading = true;
        this.clientService.findAll(this.currentPage - 1, this.pageSize, 'createdAt,desc', { searchTerm: this.searchTerm }).subscribe({
            next: (res) => {
                this.filteredClients = res.content || [];
                this.totalElements = res.totalElements;
                if (this.selectedClientId && !this.selectedClientObj) {
                    this.selectedClientObj = this.filteredClients.find(c => String(c.id) === String(this.selectedClientId)) || null;
                }
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

    selectClient(client: Client): void {
        this.selectedClientId = client.id!;
        this.selectedClientObj = client;
        this.hasConflict = false;
        this.conflictMessage = '';

        const existingPartie = this.currentAutresParties.find(p => String(p.partie?.id) === String(client.id));
        if (existingPartie) {
            this.hasConflict = true;
            this.conflictMessage = `Conflit direct : Ce contact est déjà ajouté comme ${existingPartie.role}.`;
        }
    }

    selectAndConfirm(client: Client): void {
        this.selectClient(client);
        this.onConfirm();
    }

    isSelected(clientId: string | number): boolean {
        return String(this.selectedClientId) === String(clientId);
    }

    onConfirm(): void {
        if (this.selectedClientId) {
            const client = this.selectedClientObj || this.filteredClients.find(c => String(c.id) === String(this.selectedClientId));
            if (client) {
                this.confirmSelection.emit(client);
            }
        }
    }

    onCancel(): void {
        this.closeDialog.emit();
    }
}
