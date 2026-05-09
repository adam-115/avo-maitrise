import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Client, ClientStatus } from '../../../appTypes';
import { NavigationService } from '../../../services/navigation-service';

@Component({
  selector: 'app-client-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-card.component.html',
  styleUrl: './client-card.component.css'
})
export class ClientCardComponent {
  @Input({ required: true }) client!: Client;
  private navigationService = inject(NavigationService);

  getDisplayName(): string {
    if (!this.client) return '';
    if (this.client.type === 'PERSONNE') {
      const c = this.client as any;
      return `${c.nom || ''} ${c.prenom || ''}`.trim();
    }
    const c = this.client as any;
    return c.nomCommercial || c.nom || '';
  }

  getClientSpecificInfo(): string {
    const c = this.client as any;
    if (this.client.type === 'PERSONNE') return c.cin ? `CIN: ${c.cin}` : '';
    if (this.client.type === 'SOCIETE') return c.numeroRegistreCommerce ? `RC: ${c.numeroRegistreCommerce}` : '';
    if (this.client.type === 'ASSOCIATION' || this.client.type === 'INSTITUTION') return c.numeroRegistreNational ? `RN: ${c.numeroRegistreNational}` : '';
    return '';
  }

  getTypeLabel(): string {
    switch (this.client.type) {
      case 'PERSONNE': return 'Particulier';
      case 'SOCIETE': return 'Entreprise';
      case 'ASSOCIATION': return 'Association';
      case 'INSTITUTION': return 'Institution';
      default: return this.client.type || '';
    }
  }

  getCardBgClass(): string {
    switch (this.client.type) {
      case 'PERSONNE': return 'bg-blue-50';
      case 'SOCIETE': return 'bg-purple-50';
      case 'ASSOCIATION': return 'bg-emerald-50';
      case 'INSTITUTION': return 'bg-amber-50';
      default: return 'bg-white';
    }
  }

  getCardThemeClass(): string {
    switch (this.client.type) {
      case 'PERSONNE': return 'border-blue-300 hover:border-blue-600 shadow-blue-100';
      case 'SOCIETE': return 'border-purple-300 hover:border-purple-600 shadow-purple-100';
      case 'ASSOCIATION': return 'border-emerald-300 hover:border-emerald-600 shadow-emerald-100';
      case 'INSTITUTION': return 'border-amber-300 hover:border-amber-600 shadow-amber-100';
      default: return 'border-slate-300 hover:border-cyan-600 shadow-slate-100';
    }
  }

  getTypeIcon(): string {
    switch (this.client.type) {
      case 'PERSONNE': return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
      case 'SOCIETE': return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4';
      case 'ASSOCIATION': return 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z';
      case 'INSTITUTION': return 'M8 14v20c0 4.418 7.163 8 16 8 1.38 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v20c0 4.418-7.163 8-16 8-1.38 0-2.721-.087-4-.252m0 0V42m0-28V42'; // Bank/Gov icon
      default: return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16';
    }
  }

  getTypeBadgeClass() {
    return {
      'bg-blue-600 text-white': this.client.type === 'PERSONNE',
      'bg-purple-600 text-white': this.client.type === 'SOCIETE',
      'bg-emerald-600 text-white': this.client.type === 'ASSOCIATION',
      'bg-amber-600 text-white': this.client.type === 'INSTITUTION'
    };
  }

  getAvatarClass() {
    return {
      'bg-blue-100 text-blue-600': this.client.type === 'PERSONNE',
      'bg-purple-100 text-purple-600': this.client.type === 'SOCIETE',
      'bg-emerald-100 text-emerald-600': this.client.type === 'ASSOCIATION',
      'bg-amber-100 text-amber-600': this.client.type === 'INSTITUTION'
    };
  }

  getStatusIndicatorClass() {
    return this.client.clientStatus === 'VALIDATED' || this.client.clientStatus === 'AML_VALIDATED' ? 'bg-green-500' : 'bg-slate-400';
  }

  getStatusColor(status: string | undefined): string {
    switch (status) {
      case ClientStatus.AML_REQUIRED: return 'bg-yellow-100 text-yellow-800';
      case ClientStatus.VERIFICATION_AML_REQUIRED: return 'bg-amber-100 text-amber-800';
      case ClientStatus.AML_VALIDATED: return 'bg-blue-100 text-blue-800';
      case ClientStatus.INDULGENCE_REQUIRED: return 'bg-orange-100 text-orange-800';
      case ClientStatus.INDULGENCE_VALIDATED: return 'bg-indigo-100 text-indigo-800';
      case ClientStatus.VALIDATED: return 'bg-green-100 text-green-800';
      case ClientStatus.BLOCKED: return 'bg-red-100 text-red-800';
      case ClientStatus.SUSPICIOUS: return 'bg-red-50 text-red-600 border border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  navigateToDetails() {
    this.navigationService.navigateToClientDetails(String(this.client.id));
  }

  navigateToEdit() {
    this.navigationService.navigateToClientEdit(String(this.client.id));
  }

  navigateToDiligence() {
    this.navigationService.navigateToClientDiligenceResults(String(this.client.id));
  }
}
