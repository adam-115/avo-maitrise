import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';
import { CabinetProfileService } from '../../../../services/cabinet-profile.service';
import { InvoiceEntity, CabinetProfile } from '../../../../appTypes';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-invoice-preview',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './invoice-preview.component.html',
  styleUrl: './invoice-preview.component.css'
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
  isDownloadingPdf = signal<boolean>(false);
  copiedIban = signal<boolean>(false);

  // Derived VAT Rate
  vatRate = computed(() => {
    const inv = this.invoice();
    if (!inv || typeof inv.taxRate !== 'number') return 20;
    return inv.taxRate;
  });

  taxAmount = computed(() => {
    const inv = this.invoice();
    if (!inv) return 0;
    return (inv.subtotalAmount || 0) * (this.vatRate() / 100);
  });

  totalMinutes = computed(() => {
    const entries = this.invoice()?.invoiceTimeEntries || [];
    return entries.reduce((acc, curr) => acc + (curr.nbrOfMinutes || 0), 0);
  });

  totalHoursFormatted = computed(() => {
    const totalMin = this.totalMinutes();
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
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

  editInvoice(): void {
    const inv = this.invoice();
    if (inv?.id) {
      this.router.navigate(['/home/billing/editor', inv.id]);
    }
  }

  navigateToClient(): void {
    const clientId = this.invoice()?.dossier?.client?.id;
    if (clientId) {
      this.router.navigate(['/home/client-details'], { queryParams: { id: clientId } });
    }
  }

  navigateToDossier(): void {
    const dossierId = this.invoice()?.dossier?.id;
    if (dossierId) {
      this.router.navigate(['/home/dossier-detail', dossierId]);
    }
  }

  printNative(): void {
    window.print();
  }

  printInvoice(): void {
    const inv = this.invoice();
    if (!inv || !inv.id) return;

    this.isDownloadingPdf.set(true);
    this.invoiceService.downloadInvoicePdf(inv.id).subscribe({
      next: (blob) => {
        this.isDownloadingPdf.set(false);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Facture_${inv.numeroFacture || inv.id}.pdf`;
        link.target = '_blank';
        link.click();
      },
      error: (err) => {
        this.isDownloadingPdf.set(false);
        console.error('Erreur lors du téléchargement du PDF', err);
        window.print();
      }
    });
  }

  copyIban(): void {
    const iban = this.cabinetProfile()?.iban;
    if (iban) {
      navigator.clipboard.writeText(iban);
      this.copiedIban.set(true);
      setTimeout(() => this.copiedIban.set(false), 2500);
    }
  }

  getStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20';
      case 'ISSUED':
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/20';
      case 'PARTIALLY_PAID':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200 ring-1 ring-cyan-500/20';
      case 'OVERDUE':
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/20';
      case 'CANCELLED':
      case 'WRITTEN_OFF':
        return 'bg-slate-100 text-slate-500 border-slate-200 ring-1 ring-slate-400/20';
      case 'DRAFT':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/20';
    }
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

  get clientEmail(): string | undefined {
    return this.invoice()?.dossier?.client?.email;
  }

  get clientPhone(): string | undefined {
    return this.invoice()?.dossier?.client?.telephone;
  }

  get clientType(): string | undefined {
    return this.invoice()?.dossier?.client?.type;
  }
}

