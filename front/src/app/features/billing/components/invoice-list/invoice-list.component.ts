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

    // Sélection multiple
    selectedInvoiceIds = signal<number[]>([]);

    // Filtres de recherche
    filters = {
        numeroFacture: '',
        'dossier.client.id': null as any,
        'dossier.id': null as any,
        issueDateFrom: '',
        issueDateTo: '',
        status: '' as any
    };

    invoiceStatusOptions = Object.values(InvoiceStatusEnum);

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
            'dossier.client.id': null as any,
            'dossier.id': null as any,
            issueDateFrom: '',
            issueDateTo: '',
            status: '' as any
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
        // Préparer les filtres : envoyer issueDate comme tableau si au moins une date est présente
        const searchFilters = { ...this.filters };
        let issueDates = [];
        if (this.filters.issueDateFrom) {
            issueDates.push(this.filters.issueDateFrom);
        }
        if (this.filters.issueDateTo) {
            // Si on a un to mais pas de from, il faut fournir un from (ex: 1900-01-01) pour QueryDSL
            if (issueDates.length === 0) issueDates.push('1900-01-01');
            issueDates.push(this.filters.issueDateTo);
        }
        
        let apiFilters: any = { ...searchFilters };
        delete apiFilters.issueDateFrom;
        delete apiFilters.issueDateTo;
        if (issueDates.length > 0) {
            apiFilters.issueDate = issueDates;
        }

        this.invoiceService.search(
            apiFilters,
            this.currentPage(),
            this.pageSize(),
            `${this.sortColumn()},${this.sortDirection()}`
        ).subscribe({
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

    // deleteInvoice(id: string | number | undefined) {
    //     if (!id) return;
    //     if (confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
    //         this.invoiceService.delete(id).subscribe(() => {
    //             this.loadInvoices();
    //         });
    //     }
    // }

    printInvoice(id: string | number | undefined) {
        if (!id) return;
        this.invoiceService.downloadInvoicePdf(id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
            },
            error: (err) => {
                console.error('Erreur lors du téléchargement du PDF', err);
                alert('Erreur lors de la génération de la facture PDF.');
            }
        });
    }

    generateBulkPdf() {
        const ids = this.selectedInvoiceIds();
        if (ids.length === 0) return;
        
        this.invoiceService.downloadBulkInvoicePdf(ids).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
            },
            error: (err) => {
                console.error('Erreur lors du téléchargement du PDF', err);
                alert('Erreur lors de la génération de la facture PDF global.');
            }
        });
    }

    toggleSelection(id: number | undefined) {
        if (!id) return;
        const current = this.selectedInvoiceIds();
        if (current.includes(id)) {
            this.selectedInvoiceIds.set(current.filter(i => i !== id));
        } else {
            this.selectedInvoiceIds.set([...current, id]);
        }
    }

    toggleSelectAll(event: any) {
        if (event.target.checked) {
            const allIds = this.invoices().map(inv => inv.id).filter(id => id !== undefined) as number[];
            this.selectedInvoiceIds.set(allIds);
        } else {
            this.selectedInvoiceIds.set([]);
        }
    }

    isAllSelected(): boolean {
        const currentInvoices = this.invoices();
        if (currentInvoices.length === 0) return false;
        const selected = this.selectedInvoiceIds();
        return currentInvoices.every(inv => inv.id && selected.includes(inv.id as number));
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
