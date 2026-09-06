import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Dossier, DossierTabType, Client, User, StatutDossier } from '../../appTypes';
import { ContactComponent } from "../../contact/contact/contact.component";
import { DocumentComponent } from "../../document/document/document.component";
import { EvenementComponent } from "../../evenement/evenement/evenement.component";
import { NoteComponent } from "../../note/note/note.component";
import { DossierService } from '../../services/dossier.service';
import { ClientService } from '../../services/client-service';
import { UserService } from '../../services/user.service';
import { StatutDossierService } from '../../services/statut-dossier.service';
import { AlertService } from '../../services/alert-service';
import { ClientStatusAlertComponent } from "../../shared/components/client-status-alert/client-status-alert.component";
import { DossierInfo } from "../dossier-info/dossier-info";
import { MatterActivityComponent } from "../matter-activity/matter-activity";
import { TaskManagerComponent } from "../task-manager/task-manager.component";
import { InvoiceDossierServiceComponent } from '../invoice-dossier-service/invoice-dossier-service.component';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-dossier-details',
  standalone: true,
  imports: [CommonModule, ClientStatusAlertComponent, RouterModule, TranslatePipe],
  templateUrl: './dossier-details.html',
  styleUrl: './dossier-details.css'
})
export class DossierDetails implements OnInit {

  private activatedRoute = inject(ActivatedRoute);
  private dossierService = inject(DossierService);
  private clientService = inject(ClientService);
  private userService = inject(UserService);
  private statusService = inject(StatutDossierService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  userid = "";

  selectedDossier: Dossier | null = null;
  selectedClient: Client | null = null;
  users: User[] = [];
  statuses: StatutDossier[] = [];

  activeChild: any;
  shwoDocumentDialog = false;

  showStatusDropdown = false;

  tabs: Array<{ path: string; label: string; icon: string; count?: number }> = [
    { path: 'vue-ensemble', label: 'DOSSIER_DETAILS.TAB_OVERVIEW', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { path: 'documents', label: 'DOSSIER_DETAILS.TAB_DOCS', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { path: 'evenements', label: 'DOSSIER_DETAILS.TAB_EVENTS', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { path: 'taches', label: 'DOSSIER_DETAILS.TAB_TASKS', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { path: 'notes', label: 'DOSSIER_DETAILS.TAB_NOTES', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { path: 'contacts', label: 'DOSSIER_DETAILS.TAB_CONTACTS', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { path: 'prestations', label: 'DOSSIER_DETAILS.TAB_SERVICES', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { path: 'journal', label: 'DOSSIER_DETAILS.TAB_LOG', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
  ];



  // Example: You might fetch dossier details here
  dossierDetails: any;

  ngOnInit(): void {
    this.getDossierById();
    this.loadUsers();
    this.loadStatuses();
  }

  loadStatuses(): void {
    this.statusService.getAll().subscribe((data: any) => {
      this.statuses = data.content || [];
    });
  }

  toggleStatusDropdown(): void {
    this.showStatusDropdown = !this.showStatusDropdown;
  }

  closeStatusDropdown(): void {
    this.showStatusDropdown = false;
  }

  getCurrentStatus(): StatutDossier | undefined {
    if (!this.selectedDossier || !this.selectedDossier.statutID) return undefined;
    if (typeof this.selectedDossier.statutID === 'object' && (this.selectedDossier.statutID as any).label) {
      return this.selectedDossier.statutID as StatutDossier;
    }
    const currentId = this.selectedDossier.statutID;
    return this.statuses.find(s => String(s.id) === String(currentId));
  }

  selectStatus(status: StatutDossier): void {
    this.showStatusDropdown = false;
    const currentStatus = this.getCurrentStatus();
    if (currentStatus && String(currentStatus.id) === String(status.id)) {
      return; // No change
    }

    const currentLabel = currentStatus ? currentStatus.label : 'Ouvert';
    this.alertService.confirmMessage(
      'Changement de statut',
      `Êtes-vous sûr de vouloir modifier le statut de ce dossier de "${currentLabel}" à "${status.label}" ?`,
      'question'
    ).then((confirmed) => {
      if (confirmed) {
        this.confirmStatusChange(status);
      }
    });
  }

  confirmStatusChange(status: StatutDossier): void {
    if (!this.selectedDossier || !status) return;

    const updatedDossier: Dossier = {
      ...this.selectedDossier,
      statutID: status
    };

    this.dossierService.update(updatedDossier).subscribe({
      next: (res: any) => {
        this.selectedDossier = res;
        this.alertService.success('Le statut du dossier a été mis à jour avec succès !');
      },
      error: (err) => {
        console.error('Failed to update dossier status', err);
        this.alertService.displayMessage('Erreur', 'Impossible de mettre à jour le statut du dossier.', 'error');
      }
    });
  }

  loadUsers(): void {
    this.userService.getAll().subscribe((data: any) => {
      this.users = data.content || [];
      this.updateChildComponent();
    });
  }

  public getDossierById() {
    this.activatedRoute.params.subscribe((params: any) => {
      this.dossierService.findById(params['id']).subscribe((res: any) => {
        this.selectedDossier = res;
        this.updateChildComponent();
        if (this.selectedDossier?.client?.id || this.selectedDossier?.clientId) {
          const cid = this.selectedDossier?.client?.id || this.selectedDossier?.clientId;
          this.clientService.findById(cid).subscribe(client => {
            this.selectedClient = client;
          });
        }
      });
    });
  }

  onActivate(component: any) {
    this.activeChild = component;
    this.updateChildComponent();
  }

  updateChildComponent() {
    if (!this.activeChild) return;
    
    const changes: any = {};
    let hasChanges = false;

    const setInput = (key: string, value: any) => {
      if (this.activeChild[key] !== value) {
        changes[key] = {
          previousValue: this.activeChild[key],
          currentValue: value,
          firstChange: this.activeChild[key] === undefined,
          isFirstChange: () => this.activeChild[key] === undefined
        };
        this.activeChild[key] = value;
        hasChanges = true;
      }
    };

    setInput('selectedDossier', this.selectedDossier);
    setInput('dossierId', this.selectedDossier?.id || '');
    setInput('dossierID', this.selectedDossier?.id || '');
    setInput('dossierNumber', this.selectedDossier?.referenceInterne || '');
    setInput('userId', this.userid);
    setInput('dossier', this.selectedDossier);
    setInput('users', this.users);

    if (hasChanges) {
      if (typeof this.activeChild.ngOnChanges === 'function') {
        this.activeChild.ngOnChanges(changes);
      } else if (typeof this.activeChild.ngOnInit === 'function') {
        this.activeChild.ngOnInit();
      }
    }
  }

  openDocumentDilog() {
    this.shwoDocumentDialog = true;
  }

  closeDocumentDialog() {
    this.shwoDocumentDialog = false;
  }

  getClientStatus(): string | undefined {
    if (!this.selectedClient) return undefined;
    const client = this.selectedClient as any;
    return client.clientStatus || client.status;
  }

  isClientBlocked(): boolean {
    return this.getClientStatus() === 'BLOCKED';
  }

  getClientName(): string {
    if (!this.selectedClient) return '';
    const c: any = this.selectedClient;
    if (c.type === 'SOCIETE' && c.nomCommercial) {
      return c.nomCommercial;
    }
    if (c.prenom && c.nom) {
      return `${c.prenom} ${c.nom}`;
    }
    if (c.nom) {
      return c.nom;
    }
    return 'Client inconnu';
  }
}

