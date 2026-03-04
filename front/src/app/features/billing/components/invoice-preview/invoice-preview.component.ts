import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BillingService } from '../../services/billing.service';
import { Invoice } from '../../../../appTypes';

@Component({
    selector: 'app-invoice-preview',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './invoice-preview.component.html'
})
export class InvoicePreviewComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private billingService = inject(BillingService);

    invoice = signal<Invoice | null>(null);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            const found = this.billingService.invoices().find(i => i.id === id);
            if (found) {
                this.invoice.set(found);
            } else {
                this.router.navigate(['/home/billing']);
            }
        }
    }

    printInvoice() {
        window.print();
    }
}
