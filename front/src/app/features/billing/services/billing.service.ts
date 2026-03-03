import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Invoice, InvoiceStatus } from '../models/invoice.model';
import { AbstractCrudService } from '../../../services/genericService/abstract-crud.service';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class BillingService extends AbstractCrudService<Invoice> {
    protected override apiUrl = environment.apiUrl + 'invoices';

    // Signal principal pour stocker l'état
    private invoicesSignal = signal<Invoice[]>([]);

    // Computed signals
    readonly invoices = this.invoicesSignal.asReadonly();

    readonly draftInvoices = computed(() =>
        this.invoicesSignal().filter(inv => inv.status === 'DRAFT')
    );

    readonly sentInvoices = computed(() =>
        this.invoicesSignal().filter(inv => inv.status === 'SENT')
    );

    readonly paidInvoices = computed(() =>
        this.invoicesSignal().filter(inv => inv.status === 'PAID')
    );

    readonly totalRevenue = computed(() =>
        this.paidInvoices().reduce((acc, inv) => acc + inv.totalHT, 0)
    );

    constructor(protected override http: HttpClient) {
        super(http);
        this.loadInitialData(); // Chargement depuis JSON Server
    }

    // --- Actions ---

    // Chargement initial depuis l'API JSON Server
    private loadInitialData() {
        this.getAll().subscribe((data) => {
            this.invoicesSignal.set(data || []);
        });
    }

    // Ajouter une facture via l'API, puis mise à jour du signal
    addInvoice(invoice: Invoice) {
        // L'API JSON-server va auto-générer un ID string, on crée createdAt/updatedAt
        const toSave = { ...invoice, id: Date.now().toString(), createdAt: new Date(), updatedAt: new Date() };
        this.create(toSave).subscribe((savedInvoice) => {
            this.invoicesSignal.update(current => [...current, savedInvoice]);
        });
    }

    // Mettre à jour via l'API (HTTP PUT via AbstractCrudService)
    updateInvoice(id: string, updatedData: Partial<Invoice>) {
        const existing = this.invoicesSignal().find(inv => inv.id === id);
        if (existing) {
            const invoiceToSave = { ...existing, ...updatedData, updatedAt: new Date() };
            // Utiliser la méthode update() héritée du parent abstract-crud.service 
            super.update(id, invoiceToSave).subscribe(savedInvoice => {
                this.invoicesSignal.update(current =>
                    current.map(inv => inv.id === id ? savedInvoice : inv)
                );
            });
        }
    }

    // Supprimer via l'API (HTTP DELETE via AbstractCrudService)
    deleteInvoice(id: string) {
        this.delete(id).subscribe(() => {
            this.invoicesSignal.update(current => current.filter(inv => inv.id !== id));
        });
    }
}
