import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { InvoiceService } from '../../services/invoice.service';
import { AlertService } from '../../../../services/alert-service';
import { DossierService } from '../../../../services/dossier.service';
import { ClientService } from '../../../../services/client-service';
import { InvoiceDossierServiceService } from '../../../../services/invoice-dossier-service.service';

import { ClientSelectionDialog } from '../../../../dossier/client-selection-dialog/client-selection-dialog';
import { DossierSelectionDialog } from '../../../../dossier/dossier-selection-dialog/dossier-selection-dialog';

import { Dossier, InvoiceStatusEnum, InvoiceTimeEntry } from '../../../../appTypes';

@Component({
    selector: 'app-invoice-frm',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ClientSelectionDialog, DossierSelectionDialog, TranslatePipe],
    templateUrl: './invoice-frm.component.html'
})
export class InvoiceFrmComponent {
    router = inject(Router);
    invoiceService = inject(InvoiceService);
    alertService = inject(AlertService);
    dossierService = inject(DossierService);
    clientService = inject(ClientService);
    invoiceDossierServiceService = inject(InvoiceDossierServiceService);

    showClientDialog = signal<boolean>(false);
    showDossierDialog = signal<boolean>(false);

    selectedClientId = signal<string | number | null>(null);
    selectedClientName = signal<string | null>(null);
    selectedClientData = signal<any>(null);

    selectedDossierId = signal<string | number | null>(null);
    selectedDossierName = signal<string | null>(null);
    selectedDossierData = signal<Dossier | null>(null);

    clientDossiers = signal<Dossier[]>([]);
    
    // Time entries
    unbilledEntries = signal<any[]>([]);
    vatRate = signal<number>(20);

    subtotalAmount = computed(() => {
        return this.unbilledEntries().reduce((sum, item) => {
            if (item.selected === false) return sum;
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

    // Client Selection
    openClientDialog() {
        this.showClientDialog.set(true);
    }

    closeClientDialog() {
        this.showClientDialog.set(false);
    }

    onClientSelected(client: any) {
        if (!client || !client.id) return;
        const clientId = client.id;
        this.selectedClientId.set(clientId);
        this.showClientDialog.set(false);
        this.loadClientData(clientId);
        
        // Reset dossier selection when client changes
        this.selectedDossierId.set(null);
        this.selectedDossierName.set(null);
        this.selectedDossierData.set(null);
        this.unbilledEntries.set([]);
        
        this.loadClientDossiers(clientId);
    }

    loadClientData(clientId: string | number) {
        this.clientService.findById(clientId).subscribe((client: any) => {
            this.selectedClientData.set(client);
            if (client.type === 'PERSONNE') {
                this.selectedClientName.set(`${client.nom || ''} ${client.prenom || ''}`.trim() || `Client #${client.id}`);
            } else {
                this.selectedClientName.set(client.nomCommercial || client.nom || `Client #${client.id}`);
            }
        });
    }

    loadClientDossiers(clientId: string | number) {
        this.dossierService['http'].get<any>(`${this.dossierService['apiUrl']}/search?client.id=${clientId}`).subscribe({
            next: (res) => {
                this.clientDossiers.set(res.content || res || []);
            },
            error: (err) => {
                console.error("Failed to load dossiers for client", err);
                this.clientDossiers.set([]);
            }
        });
    }

    // Dossier Selection
    openDossierDialog() {
        if (!this.selectedClientId()) {
            this.alertService.displayMessage('Attention', 'Veuillez d\'abord sélectionner un client', 'warning');
            return;
        }
        this.showDossierDialog.set(true);
    }

    closeDossierDialog() {
        this.showDossierDialog.set(false);
    }

    onDossierSelected(dossierId: string | number) {
        this.selectedDossierId.set(dossierId);
        this.showDossierDialog.set(false);
        
        const dossier = this.clientDossiers().find(d => String(d.id) === String(dossierId));
        if (dossier) {
            this.selectedDossierData.set(dossier);
            this.selectedDossierName.set(dossier.titre || dossier.referenceInterne || `Dossier #${dossier.id}`);
            this.loadUnbilledPrestations(dossierId);
        }
    }

    // Prestations
    loadUnbilledPrestations(dossierId: string | number) {
        this.invoiceDossierServiceService['http'].get<any>(`${this.invoiceDossierServiceService['apiUrl']}/search?dossier.id=${dossierId}`).subscribe({
            next: (res) => {
                const prestations = res.content || res || [];
                const eligible = prestations.filter((p: any) => 
                    p.status === 'A_FACTURE'
                );

                const mappedEntries: any[] = eligible.map((p: any) => ({
                    invoiceDossierService: p,
                    nbrOfMinutes: p.nbrOfMinutes || 0,
                    price5min: p.invoiceTypeOfService?.price5min || 0,
                    selected: true // By default, select all eligible prestations for a new invoice
                }));

                this.unbilledEntries.set(mappedEntries);
            },
            error: (err: any) => {
                this.alertService.displayMessage('Erreur', 'Impossible de charger les prestations', 'error');
            }
        });
    }

    toggleEntrySelection(index: number) {
        const entries = [...this.unbilledEntries()];
        entries[index] = { ...entries[index], selected: !entries[index].selected };
        this.unbilledEntries.set(entries);
    }

    removeEntry(index: number) {
        const entries = [...this.unbilledEntries()];
        entries.splice(index, 1);
        this.unbilledEntries.set(entries);
    }

    // Submit
    generateInvoice() {
        if (!this.selectedDossierId()) {
            this.alertService.displayMessage('Erreur', 'Veuillez sélectionner un dossier', 'error');
            return;
        }

        const entriesToBill = this.unbilledEntries().filter((e: any) => e.selected !== false);
        if (entriesToBill.length === 0) {
            this.alertService.displayMessage('Erreur', 'Veuillez sélectionner au moins une prestation à facturer', 'error');
            return;
        }

        const newInvoice: any = {
            dossier: { id: this.selectedDossierId() },
            status: InvoiceStatusEnum.DRAFT,
            issueDate: new Date().toISOString(),
            dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(), // Default: 1 month later
            subtotalAmount: this.subtotalAmount(),
            taxRate: this.vatRate(),
            totalAmount: this.totalAmount(),
            invoiceTimeEntries: entriesToBill.map((e: any) => {
                // Remove the UI specific 'selected' property
                const { selected, ...entryData } = e;
                return entryData;
            })
        };

        this.alertService.confirmMessage('Créer la facture', 'Voulez-vous générer cette facture ?', 'question').then(confirmed => {
            if (confirmed) {
                this.invoiceService.create(newInvoice).subscribe({
                    next: (res) => {
                        this.alertService.success('Facture créée avec succès');
                        this.router.navigate(['/home/billing']);
                    },
                    error: (err) => {
                        this.alertService.displayMessage('Erreur', 'Impossible de créer la facture', 'error');
                    }
                });
            }
        });
    }

    goBack() {
        this.router.navigate(['/home/billing']);
    }
}
