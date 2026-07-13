import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../services/invoice.service';
import { InvoiceEntity, InvoiceStatusEnum } from '../../../../appTypes';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ClientSelectionDialog } from '../../../../dossier/client-selection-dialog/client-selection-dialog';
import { DossierSelectionDialog } from '../../../../dossier/dossier-selection-dialog/dossier-selection-dialog';
import { Client, Dossier } from '../../../../appTypes';
import { DossierService } from '../../../../services/dossier.service';

@Component({
    selector: 'app-invoice-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ClientSelectionDialog, DossierSelectionDialog],
    templateUrl: './invoice-list.component.html'
})
export class InvoiceListComponent implements OnInit {
    invoiceService = inject(InvoiceService);
    router = inject(Router);
    dossierService = inject(DossierService);
    
    // Pagination (0-indexed pour Spring Boot)
    currentPage = signal(0);
    pageSize = signal(10);
    
    totalElements = signal(0);
    totalPages = signal(1);

    // Liste paginée pour l'affichage
    invoices = signal<InvoiceEntity[]>([]);

    // Filtres de recherche
    filters = {
        numeroFacture: '',
        'dossier.client.id': null as any,
        'dossier.id': null as any,
        issueDate: ''
    };

    // Sorting
    sortColumn = signal<string>('issueDate');
    sortDirection = signal<'asc' | 'desc'>('desc');

    // Dialog state
    showClientDialog = signal<boolean>(false);
    showDossierDialog = signal<boolean>(false);
    selectedClientName = signal<string | null>(null);
    selectedDossierName = signal<string | null>(null);
    clientDossiers = signal<Dossier[]>([]);

    // Subject for debouncing search input
    private searchSubject = new Subject<void>();

    ngOnInit() {
        this.loadInvoices();
        
        // Setup debounced search
        this.searchSubject.pipe(
            debounceTime(400)
        ).subscribe(() => {
            this.currentPage.set(0); // Reset to first page on new search
            this.loadInvoices();
        });
    }

    onFilterChange() {
        this.searchSubject.next();
    }

    resetFilters() {
        this.filters = {
            numeroFacture: '',
            'dossier.client.id': null,
            'dossier.id': null,
            issueDate: ''
        };
        this.selectedClientName.set(null);
        this.selectedDossierName.set(null);
        this.clientDossiers.set([]);
        this.currentPage.set(0);
        this.loadInvoices();
    }

    sortBy(column: string) {
        if (this.sortColumn() === column) {
            this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
        } else {
            this.sortColumn.set(column);
            this.sortDirection.set('asc');
        }
        this.currentPage.set(0);
        this.loadInvoices();
    }

    openClientDialog() {
        this.showClientDialog.set(true);
    }

    onClientSelected(client: Client) {
        this.filters['dossier.client.id'] = client.id;
        this.selectedClientName.set(this.getClientName(client));
        this.showClientDialog.set(false);
        this.filters['dossier.id'] = null; // reset dossier when client changes
        this.selectedDossierName.set(null);
        
        // Load dossiers for this client
        this.dossierService.search({ 'client.id': client.id }, 0, 100, '').subscribe(res => {
            this.clientDossiers.set(res.content || []);
        });

        this.onFilterChange();
    }

    openDossierDialog() {
        this.showDossierDialog.set(true);
    }

    onDossierSelected(dossierId: string | number) {
        this.filters['dossier.id'] = dossierId;
        const d = this.clientDossiers().find(d => d.id === dossierId);
        if (d) {
            this.selectedDossierName.set(d.referenceInterne || `Dossier ${d.id}`);
        }
        this.showDossierDialog.set(false);
        this.onFilterChange();
    }

    loadInvoices() {
        // OrderBy issueDate descending with pagination
        // Using the search endpoint if filters exist, otherwise fallback to findAll (or just always use search if supported)
        const currentFilters = this.filters;
        let queryFilters: any = {};
        
        // Clean up empty filters
        Object.keys(currentFilters).forEach(key => {
            if ((currentFilters as any)[key]) {
                queryFilters[key] = (currentFilters as any)[key];
            }
        });

        const sortParam = `${this.sortColumn()},${this.sortDirection()}`;

        // Use search endpoint which should map to GET /api/invoice/search?{params}
        // Since invoiceService inherits searchByCriteria (which is POST /search), we will just use a direct http call 
        // or add it to invoiceService.
        
        this.invoiceService.search(queryFilters, this.currentPage(), this.pageSize(), sortParam)
            .subscribe({
                next: (res) => {
                    this.invoices.set(res.content || []);
                    this.totalElements.set(res.totalElements || 0);
                    this.totalPages.set(res.totalPages || 1);
                },
                error: (err) => {
                    console.error('Erreur lors du chargement des factures', err);
                }
            });
    }

    nextPage() {
        if (this.currentPage() < this.totalPages() - 1) {
            this.currentPage.update(p => p + 1);
            this.loadInvoices();
        }
    }

    prevPage() {
        if (this.currentPage() > 0) {
            this.currentPage.update(p => p - 1);
            this.loadInvoices();
        }
    }

    // Actions
    createInvoice() {
        this.router.navigate(['/home/billing/new']);
    }

    editInvoice(id: string | number | undefined) {
        if(id) this.router.navigate(['/home/billing/editor', id]);
    }

    previewInvoice(id: string | number | undefined) {
        if(id) this.router.navigate(['/home/billing/preview', id]);
    }

    deleteInvoice(id: string | number | undefined) {
        if (!id) return;
        if (confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
            this.invoiceService.delete(id).subscribe(() => {
                this.loadInvoices();
            });
        }
    }

    printInvoice(id: string | number | undefined) {
        if (!id) return;
        this.invoiceService.downloadInvoicePdf(id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
                // Note: It's good practice to revoke the object URL later, 
                // but since it's opening in a new tab, the browser manages it, 
                // or we could do setTimeout(() => window.URL.revokeObjectURL(url), 1000);
            },
            error: (err) => {
                console.error('Erreur lors du téléchargement du PDF', err);
                alert('Erreur lors de la génération de la facture PDF.');
            }
        });
    }

    getStatusBadge(status: InvoiceStatusEnum) {
        switch (status) {
            case InvoiceStatusEnum.DRAFT: return { label: 'Brouillon', classes: 'bg-gray-100 text-gray-800 border-gray-200' };
            case InvoiceStatusEnum.ISSUED: return { label: 'Emise', classes: 'bg-blue-100 text-blue-800 border-blue-200' };
            case InvoiceStatusEnum.PARTIALLY_PAID: return { label: 'Partiellement Payée', classes: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
            case InvoiceStatusEnum.PAID: return { label: 'Payée', classes: 'bg-green-100 text-green-800 border-green-200' };
            case InvoiceStatusEnum.OVERDUE: return { label: 'En retard', classes: 'bg-red-100 text-red-800 border-red-200' };
            case InvoiceStatusEnum.CANCELLED: return { label: 'Annulée', classes: 'bg-gray-100 text-gray-600 border-gray-200' };
            case InvoiceStatusEnum.WRITTEN_OFF: return { label: 'Irrécouvrable', classes: 'bg-purple-100 text-purple-800 border-purple-200' };
            default: return { label: status, classes: 'bg-gray-100 text-gray-800 border-gray-200' };
        }
    }

    getClientName(client: any): string {
        if (!client) return 'Client N/A';
        if (client.type === 'PERSONNE') {
            return `${client.nom || ''} ${client.prenom || ''}`.trim() || `Client #${client.id}`;
        }
        return client.nomCommercial || client.nom || `Client #${client.id}`;
    }
}
