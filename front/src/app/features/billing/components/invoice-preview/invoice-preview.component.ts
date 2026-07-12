import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';
import { CabinetProfileService } from '../../../../services/cabinet-profile.service';
import { InvoiceEntity, CabinetProfile } from '../../../../appTypes';

@Component({
  selector: 'app-invoice-preview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './invoice-preview.component.html'
})
export class InvoicePreviewComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  location = inject(Location);
  invoiceService = inject(InvoiceService);
  cabinetProfileService = inject(CabinetProfileService);

  invoice = signal<InvoiceEntity | null>(null);
  cabinetProfile = signal<CabinetProfile | null>(null);
  isLoading = signal<boolean>(true);

  // Derived VAT Rate (we assume 20% if not stored, but the user requested displaying it)
  // Let's compute it if we can, or just hardcode 20% for display if subtotal is available
  vatRate = computed(() => {
    const inv = this.invoice();
    if (!inv || !inv.subtotalAmount || inv.subtotalAmount === 0) return 20;
    return Math.round((inv.taxAmount / inv.subtotalAmount) * 100);
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadData(Number(id));
      }
    });
  }

  loadData(invoiceId: number): void {
    this.isLoading.set(true);

    // Load Invoice
    this.invoiceService.findById(invoiceId).subscribe({
      next: (invData) => {
        this.invoice.set(invData);
        // Load Profile
        this.cabinetProfileService.getProfile().subscribe({
          next: (profileData) => {
            this.cabinetProfile.set(profileData);
            this.isLoading.set(false);
          },
          error: (err) => {
            console.error('Erreur chargement profil', err);
            this.isLoading.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Erreur chargement facture', err);
        this.isLoading.set(false);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  printInvoice(): void {
    window.print();
  }

  get clientName(): string {
    const client = this.invoice()?.dossier?.client;
    if (!client) return 'Client inconnu';
    if (client.type === 'SOCIETE' || client.type === 'INSTITUTION' || client.type === 'ASSOCIATION' || (client as any).nomCommercial || (client as any).nomSociete) {
      return (client as any).nomCommercial || (client as any).nomSociete || (client as any).nom || 'Société';
    }
    return `${(client as any).prenom || ''} ${(client as any).nom || ''}`.trim() || 'Client';
  }

  get clientAddress(): string {
    const client = this.invoice()?.dossier?.client;
    return client?.adresse || 'Adresse non renseignée';
  }
}

