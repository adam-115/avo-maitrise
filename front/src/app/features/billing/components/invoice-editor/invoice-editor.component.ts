import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BillingService } from '../../services/billing.service';
import { Invoice, InvoiceLineItem, InvoiceStatus } from '../../models/invoice.model';

@Component({
    selector: 'app-invoice-editor',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './invoice-editor.component.html'
})
export class InvoiceEditorComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private billingService = inject(BillingService);

    invoiceId = signal<string | null>(null);

    invoiceForm = new FormGroup({
        invoiceNumber: new FormControl('', Validators.required),
        date: new FormControl<string>(new Date().toISOString().substring(0, 10), Validators.required),
        clientId: new FormControl('', Validators.required),
        status: new FormControl<InvoiceStatus>('DRAFT'),
        lineItems: new FormArray<FormGroup>([]),
        disbursements: new FormControl(0, [Validators.min(0)])
    });

    // Signals réactifs pour les totaux
    totalHT = signal(0);
    totalVAT = signal(0);
    totalTTC = signal(0);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.invoiceId.set(id);
            this.loadInvoice(id);
        } else {
            // Pré-remplir un numéro brouillon simple
            this.invoiceForm.patchValue({
                invoiceNumber: `FAC-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
            });
            this.addLineItem(); // Ajoute une ligne vide par défaut
        }

        // Réagir aux changements du formulaire pour recalculer les totaux
        this.invoiceForm.valueChanges.subscribe(() => {
            this.calculateTotals();
        });
    }

    get lineItemsArr() {
        return this.invoiceForm.get('lineItems') as FormArray;
    }

    addLineItem(item?: InvoiceLineItem) {
        const group = new FormGroup({
            description: new FormControl(item?.description || '', Validators.required),
            quantity: new FormControl(item?.quantity || 1, [Validators.required, Validators.min(0.01)]),
            hourlyRate: new FormControl(item?.hourlyRate || 0, [Validators.required, Validators.min(0)]),
            vatRate: new FormControl(item?.vatRate || 20, [Validators.required, Validators.min(0)])
        });
        this.lineItemsArr.push(group);
    }

    removeLineItem(index: number) {
        this.lineItemsArr.removeAt(index);
    }

    calculateTotals() {
        let ht = 0;
        let vat = 0;

        const items = this.lineItemsArr.value as any[];
        items.forEach(item => {
            const q = parseFloat(item.quantity) || 0;
            const rate = parseFloat(item.hourlyRate) || 0;
            const v = parseFloat(item.vatRate) || 0;

            const rowHT = q * rate;
            const rowVAT = rowHT * (v / 100);

            ht += rowHT;
            vat += rowVAT;
        });

        const disbursements = parseFloat(this.invoiceForm.get('disbursements')?.value?.toString() || '0');

        this.totalHT.set(ht);
        this.totalVAT.set(vat);
        this.totalTTC.set(ht + vat + disbursements);
    }

    loadInvoice(id: string) {
        const invoice = this.billingService.invoices().find(i => i.id === id);
        if (invoice) {
            this.invoiceForm.patchValue({
                invoiceNumber: invoice.invoiceNumber,
                date: new Date(invoice.date).toISOString().substring(0, 10),
                clientId: invoice.clientId,
                status: invoice.status,
                disbursements: invoice.disbursements
            });
            invoice.lineItems.forEach(li => this.addLineItem(li));
            this.calculateTotals();
        }
    }

    save() {
        if (this.invoiceForm.invalid) {
            this.invoiceForm.markAllAsTouched();
            return;
        }

        const val = this.invoiceForm.value;

        // Mapper les lignes
        const mappedLines: InvoiceLineItem[] = (val.lineItems as any[]).map((li, index) => {
            const totalHT = li.quantity * li.hourlyRate;
            return {
                id: index.toString(),
                description: li.description,
                quantity: li.quantity,
                hourlyRate: li.hourlyRate,
                vatRate: li.vatRate,
                totalHT,
                totalTTC: totalHT * (1 + (li.vatRate / 100))
            };
        });

        const newInvoice: Partial<Invoice> = {
            invoiceNumber: val.invoiceNumber!,
            date: new Date(val.date!),
            clientId: val.clientId!,
            status: val.status as InvoiceStatus,
            disbursements: val.disbursements || 0,
            lineItems: mappedLines,
            totalHT: this.totalHT(),
            totalVAT: this.totalVAT(),
            totalTTC: this.totalTTC()
        };

        const currentId = this.invoiceId();
        if (currentId) {
            this.billingService.updateInvoice(currentId, newInvoice);
        } else {
            this.billingService.addInvoice(newInvoice as Invoice);
        }

        this.router.navigate(['/home/billing']);
    }
}
