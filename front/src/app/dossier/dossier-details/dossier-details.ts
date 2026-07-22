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

@Component({
  selector: 'app-dossier-details',
  imports: [CommonModule, ClientStatusAlertComponent, RouterModule],
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
