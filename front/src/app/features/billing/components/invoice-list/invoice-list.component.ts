import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../../services/billing.service';
import { Invoice, InvoiceStatus } from '../../../../appTypes';
import { Router } from '@angular/router';

@Component({
    selector: 'app-invoice-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './invoice-list.component.html'
})
export class InvoiceListComponent {
    billingService = inject(BillingService);
    router = inject(Router);

    // Filtres locaux (Signals)
    searchTerm = signal('');
    selectedStatus = signal<InvoiceStatus | 'ALL'>('ALL');

    // KPIs
    totalRevenue = this.billingService.totalRevenue;
    totalInvoices = computed(() => this.billingService.invoices().length);
    draftCount = computed(() => this.billingService.draftInvoices().length);
    paidCount = computed(() => this.billingService.paidInvoices().length);

    // Liste filtrée
    filteredInvoices = computed(() => {
        let invoices = this.billingService.invoices();

        // Filtre par statut
        const status = this.selectedStatus();
        if (status !== 'ALL') {
            invoices = invoices.filter(inv => inv.status === status);
        }

        // Filtre par recherche texte
        const term = this.searchTerm().toLowerCase();
        if (term) {
            invoices = invoices.filter(inv =>
                inv.invoiceNumber.toLowerCase().includes(term) ||
                inv.clientId.toLowerCase().includes(term)
            );
        }
        return invoices;
    });

    // Actions
    createInvoice() {
        this.router.navigate(['/home/billing/editor']);
    }

    editInvoice(id: string) {
        this.router.navigate(['/home/billing/editor', id]);
    }

    previewInvoice(id: string) {
        this.router.navigate(['/home/billing/preview', id]);
    }

    deleteInvoice(id: string) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
            this.billingService.deleteInvoice(id);
        }
    }

    getStatusBadge(status: InvoiceStatus) {
        switch (status) {
            case 'DRAFT': return { label: 'Brouillon', classes: 'bg-gray-100 text-gray-800 border-gray-200' };
            case 'SENT': return { label: 'Envoyée', classes: 'bg-blue-100 text-blue-800 border-blue-200' };
            case 'PAID': return { label: 'Payée', classes: 'bg-green-100 text-green-800 border-green-200' };
        }
    }
}
