import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';
import { InvoiceEntity, InvoiceStatusEnum, InvoiceTimeEntry } from '../../../../appTypes';
import { AlertService } from '../../../../services/alert-service';
import { GenerateInvoiceDialog } from '../../../../dossier/generate-invoice-dialog/generate-invoice-dialog';
import { InvoiceDossierServiceService } from '../../../../services/invoice-dossier-service.service';

@Component({
    selector: 'app-invoice-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, GenerateInvoiceDialog],
    templateUrl: './invoice-editor.component.html'
})
export class InvoiceEditorComponent implements OnInit {
    route = inject(ActivatedRoute);
    router = inject(Router);
    invoiceService = inject(InvoiceService);
    invoiceDossierServiceService = inject(InvoiceDossierServiceService);
    alertService = inject(AlertService);
    location = inject(Location);
    
    invoiceId = signal<number | null>(null);
    invoice = signal<InvoiceEntity | null>(null);

    // Edit fields
    status = signal<InvoiceStatusEnum>(InvoiceStatusEnum.DRAFT);
    dueDate = signal<string>('');
    note = signal<string>('');
    vatRate = signal<number>(20);
    
    timeEntries = signal<any[]>([]);

    statusOptions = Object.values(InvoiceStatusEnum);
    
    showGenerateInvoiceModal = signal<boolean>(false);
    unbilledEntries = signal<InvoiceTimeEntry[]>([]);

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.invoiceId.set(Number(id));
                this.loadInvoice(this.invoiceId()!);
            }
        });
    }

    loadInvoice(id: number) {
        this.invoiceService.findById(id).subscribe({
            next: (data) => {
                this.invoice.set(data);
                this.status.set(data.status);
                this.note.set(data.note || '');
                if (data.dueDate) {
                    const dateObj = new Date(data.dueDate);
                    this.dueDate.set(dateObj.toISOString().split('T')[0]);
                }
                if (data.subtotalAmount > 0) {
                   this.vatRate.set(data.taxRate);
                }
                
                if (data.invoiceTimeEntries) {
                    this.timeEntries.set(data.invoiceTimeEntries.map(e => ({ ...e })));
                }
            },
            error: (err) => {
                this.alertService.displayMessage('Erreur', 'Impossible de charger la facture', 'error');
                this.router.navigate(['/home/billing']);
            }
        });
    }

    // Calculs
    subtotalAmount = computed(() => {
        return this.timeEntries().reduce((sum, item) => {
            const minutes = item.nbrOfMinutes || 0;
            const price = item.price5min || 0;
            return sum + ((minutes / 5) * price);
        }, 0);
    });

    taxAmount = computed(() => {
        return this.subtotalAmount() * (this.vatRate() / 100);
    });

    totalAmount = computed(() => {
        return this.subtotalAmount() + this.taxAmount();
    });

    onEntryChange() {
        this.timeEntries.set([...this.timeEntries()]);
    }

    openAddPrestations() {
        const dossierId = this.invoice()?.dossier?.id;
        if (!dossierId) return;

        this.invoiceDossierServiceService['http'].get<any>(`${this.invoiceDossierServiceService['apiUrl']}/search?dossier.id=${dossierId}`).subscribe({
            next: (res) => {
                const prestations = res.content || [];
                const eligible = prestations.filter((p: any) => 
                    p.invoiceDossierServieStatus?.code === 'EN_ATTENTE' || 
                    p.invoiceDossierServieStatus?.code === 'REPORTED'
                );

                const mappedEntries: InvoiceTimeEntry[] = eligible.map((p: any) => ({
                    invoiceDossierService: p,
                    nbrOfMinutes: p.nbrOfMinutes || 0,
                    price5min: p.invoiceTypeOfService?.price5min || 0,
                }));

                const currentIds = this.timeEntries().map(e => e.invoiceDossierService?.id);
                const finalEntries = mappedEntries.filter(e => !currentIds.includes(e.invoiceDossierService?.id));

                this.unbilledEntries.set(finalEntries);
                this.showGenerateInvoiceModal.set(true);
            },
            error: (err: any) => {
                this.alertService.displayMessage('Erreur', 'Impossible de charger les prestations', 'error');
            }
        });
    }

    onConfirmAddPrestations(selectedItems: InvoiceTimeEntry[]) {
        const updatedEntries = [...this.timeEntries(), ...selectedItems];
        this.timeEntries.set(updatedEntries);
        this.showGenerateInvoiceModal.set(false);
        this.onEntryChange();
    }

    removeEntry(index: number) {
        this.alertService.confirmMessage(
            'Retirer la prestation',
            'Voulez-vous vraiment retirer cette prestation de la facture ?',
            'warning'
        ).then(confirmed => {
            if (confirmed) {
                const updatedEntries = [...this.timeEntries()];
                updatedEntries.splice(index, 1);
                this.timeEntries.set(updatedEntries);
                this.onEntryChange();
            }
        });
    }

    goBack() {
        this.location.back();
    }

    saveInvoice() {
        const currentInvoice = this.invoice();
        if (!currentInvoice) return;

        this.alertService.confirmMessage(
            'Sauvegarder',
            'Voulez-vous vraiment enregistrer ces modifications ?',
            'question'
        ).then(confirmed => {
            if (confirmed) {
                const updatedInvoice: InvoiceEntity = {
                    ...currentInvoice,
                    status: this.status(),
                    dueDate: new Date(this.dueDate()),
                    note: this.note(),
                    subtotalAmount: this.subtotalAmount(),
                    taxRate: this.vatRate(),
                    totalAmount: this.totalAmount(),
                    invoiceTimeEntries: this.timeEntries()
                };

                this.invoiceService.update(updatedInvoice).subscribe({
                    next: () => {
                        this.alertService.success('Facture mise à jour avec succès');
                        this.router.navigate(['/home/billing']);
                    },
                    error: (err) => {
                        this.alertService.displayMessage('Erreur', 'Erreur lors de la sauvegarde de la facture', 'error');
                    }
                });
            }
        });
    }
    
    getClientName(client: any): string {
        if (!client) return 'Client N/A';
        if (client.type === 'PERSONNE') {
            return `${client.nom || ''} ${client.prenom || ''}`.trim();
        }
        return client.nomCommercial || client.nom || `Client #${client.id}`;
    }
}
