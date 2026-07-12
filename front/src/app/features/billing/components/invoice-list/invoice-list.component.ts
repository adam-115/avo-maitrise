import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../services/invoice.service';
import { InvoiceEntity, InvoiceStatusEnum } from '../../../../appTypes';
import { Router, RouterModule } from '@angular/router';

@Component({
    selector: 'app-invoice-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './invoice-list.component.html'
})
export class InvoiceListComponent implements OnInit {
    invoiceService = inject(InvoiceService);
    router = inject(Router);
    
    // Pagination (0-indexed pour Spring Boot)
    currentPage = signal(0);
    pageSize = signal(10);
    
    totalElements = signal(0);
    totalPages = signal(1);

    // Liste paginée pour l'affichage
    invoices = signal<InvoiceEntity[]>([]);

    ngOnInit() {
        this.loadInvoices();
    }

    loadInvoices() {
        // OrderBy issueDate descending with pagination
        this.invoiceService.findAll(this.currentPage(), this.pageSize(), 'issueDate,desc')
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
