import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ClientService } from '../../services/client-service';
import { DossierService } from '../../services/dossier.service';
import { InvoiceService } from '../../features/billing/services/invoice.service';
import { ClientDiligenceStatusService } from '../../services/client-diligence-status-service';

import { Client, Dossier, InvoiceEntity, ClientDiligenceStatus, ClientMoral, ClientPersonnePhysique, ClientTypeEnum } from '../../appTypes';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-client-details',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './client-details.component.html',
  styleUrl: './client-details.component.css'
})
export class ClientDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private clientService = inject(ClientService);
  private dossierService = inject(DossierService);
  private invoiceService = inject(InvoiceService);
  private amlStatusService = inject(ClientDiligenceStatusService);

  clientId: string | null = null;
  client: Client | null = null;
  dossiers: Dossier[] = [];
  invoices: InvoiceEntity[] = [];
  amlStatusList: ClientDiligenceStatus[] = [];
  latestAmlStatus: ClientDiligenceStatus | null = null;

  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.clientId = params['id'];
      if (this.clientId) {
        this.loadClientData(this.clientId);
      } else {
        this.error = "CLIENT_DETAILS.NO_ID";
        this.isLoading = false;
      }
    });
  }

  private loadClientData(id: string): void {
    this.isLoading = true;
    this.error = null;

    forkJoin({
      client: this.clientService.findById(id).pipe(catchError(e => of(null))),
      dossiers: this.dossierService.search({ 'client.id': id }, 0, 100).pipe(catchError(e => of({ content: [] }))),
      invoices: this.invoiceService.search({ 'dossier.client.id': id }, 0, 100).pipe(catchError(e => of({ content: [] }))),
      amlStatus: this.amlStatusService.findByClientId(id).pipe(catchError(e => of([])))
    }).subscribe({
      next: (result) => {
        this.client = result.client as Client;
        
        // Handle paginated responses
        this.dossiers = (result.dossiers as any)?.content || [];
        this.invoices = (result.invoices as any)?.content || [];
        
        this.amlStatusList = result.amlStatus || [];
        // Assuming the list might contain historical records, let's take the first one or most recent
        if (this.amlStatusList && this.amlStatusList.length > 0) {
          // Sort by date if possible, otherwise just take the first
          this.latestAmlStatus = this.amlStatusList[0]; 
        }

        if (!this.client) {
          this.error = "CLIENT_DETAILS.LOAD_ERROR";
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données client', err);
        this.error = "CLIENT_DETAILS.LOAD_ERROR_GENERIC";
        this.isLoading = false;
      }
    });
  }

  getClientName(): string {
    if (!this.client) return '';
    if (this.client.type === 'PERSONNE') {
      return `${(this.client as any).nom || ''} ${(this.client as any).prenom || ''}`.trim();
    } else {
      return (this.client as any).nomCommercial || '';
    }
  }
  
  getClientInitials(): string {
    const name = this.getClientName();
    if (!name) return '??';
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return '??';
  }

  getAmlBadgeClass(): string {
    if (!this.latestAmlStatus) return 'bg-gray-100 text-gray-800';
    
    const status = this.latestAmlStatus.status?.toUpperCase();
    if (status === 'VALIDATED') return 'bg-green-100 text-green-800 border-green-200';
    if (status === 'PENDING') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (status === 'SUBMITTED') return 'bg-blue-100 text-blue-800 border-blue-200';
    
    return 'bg-gray-100 text-gray-800 border-gray-200';
  }
  
  getAmlStatusIcon(): string {
    if (!this.latestAmlStatus) return 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'; // Info icon
    
    const status = this.latestAmlStatus.status?.toUpperCase() || '';
    if (status === 'VALIDATED') {
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'; // Check circle
    }
    if (status === 'PENDING' || status === 'SUBMITTED') {
      return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'; // Clock
    }
    
    return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'; // Warning
  }

  getInvoiceStatusBadge(status: string | undefined): string {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800 border-green-200';
      case 'DRAFT': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'SENT': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'OVERDUE': return 'bg-red-100 text-red-800 border-red-200';
      case 'PARTIALLY_PAID': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  getInvoiceStatusLabel(status: string | undefined): string {
    if (!status) return 'CLIENT_DETAILS.UNKNOWN';
    
    switch (status) {
      case 'PAID': return 'CLIENT_DETAILS.INVOICE_STATUS_PAID';
      case 'DRAFT': return 'CLIENT_DETAILS.INVOICE_STATUS_DRAFT';
      case 'SENT': return 'CLIENT_DETAILS.INVOICE_STATUS_SENT';
      case 'OVERDUE': return 'CLIENT_DETAILS.INVOICE_STATUS_OVERDUE';
      case 'PARTIALLY_PAID': return 'CLIENT_DETAILS.INVOICE_STATUS_PARTIAL';
      default: return status;
    }
  }

  get isMoral(): boolean {
    return this.client?.type === ClientTypeEnum.SOCIETE || (this.client?.type as any) === 'MORAL';
  }

  get isPhysique(): boolean {
    return this.client?.type === ClientTypeEnum.PERSONNE;
  }

  get moralClient(): ClientMoral | null {
    return this.isMoral ? (this.client as ClientMoral) : null;
  }

  get physiqueClient(): ClientPersonnePhysique | null {
    return this.isPhysique ? (this.client as ClientPersonnePhysique) : null;
  }

  get hasAdditionalInfo(): boolean {
    if (!this.client) return false;
    if (this.isMoral) {
      const m = this.moralClient;
      return !!(m?.formeJuridique || m?.numeroRegistreCommerce || m?.numeroIdFiscal || m?.nomRepresentantLegal || m?.adresse || m?.pays);
    }
    if (this.isPhysique) {
      const p = this.physiqueClient;
      return !!(p?.nationalite || p?.cin || p?.dateNaissance || p?.adresse || p?.pays);
    }
    return !!(this.client.adresse || this.client.pays);
  }

  getDossierStatusBadge(status: any): string {
    return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
  }
}

