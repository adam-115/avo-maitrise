import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { InvoiceDossierServiceService } from '../../services/invoice-dossier-service.service';
import { InvoiceTypeOfServiceService } from '../../services/invoice-type-of-service.service';
import { InvoiceDossierServieStatusService } from '../../services/invoice-dossier-servie-status.service';
import { InvoiceDossierService, InvoiceTypeOfService, InvoiceDossierServieStatus, User } from '../../appTypes';
import { AlertService } from '../../services/alert-service';
import { UserService } from '../../services/user.service';
import { KeycloakService } from '../../services/keycloak.service';
import { UserSelectionDialog } from '../user-selection-dialog/user-selection-dialog';

@Component({
  selector: 'app-invoice-dossier-service',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, UserSelectionDialog],
  templateUrl: './invoice-dossier-service.component.html',
  styleUrls: []
})
export class InvoiceDossierServiceComponent implements OnInit {
  @Input() dossierId!: string | number;

  prestations: InvoiceDossierService[] = [];
  typesOfService: InvoiceTypeOfService[] = [];
  statuses: InvoiceDossierServieStatus[] = [];
  users: User[] = [];
  
  currentUser: User | null = null;
  selectedDoneByUser: User | null = null;
  
  showModal = false;
  showUserSelectionDialog = false;
  editingPrestationId: number | null = null;
  prestationForm: FormGroup;
  
  private prestationService = inject(InvoiceDossierServiceService);
  private typeOfService = inject(InvoiceTypeOfServiceService);
  private statusService = inject(InvoiceDossierServieStatusService);
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);
  private userService = inject(UserService);
  private keycloakService = inject(KeycloakService);

  constructor() {
    this.prestationForm = this.fb.group({
      info: ['', Validators.required],
      nbrOfMinutes: [5, [Validators.required, Validators.min(5)]],
      invoiceTypeOfServiceId: [null, Validators.required],
      invoiceDossierServieStatusId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadPrestations();
    this.loadTypesOfService();
    this.loadStatuses();
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getAll().subscribe({
      next: (res: any) => {
        this.users = res.content || res || [];
        const username = this.keycloakService.getUsername();
        if (username) {
          this.currentUser = this.users.find(u => u.username === username || u.email === username) || null;
          if (!this.selectedDoneByUser && this.currentUser) {
            this.selectedDoneByUser = this.currentUser;
          }
        }
      },
      error: (err) => console.error(err)
    });
  }

  loadStatuses(): void {
    this.statusService.getAll().subscribe({
      next: (res: any) => {
        this.statuses = res.content || [];
      },
      error: (err) => console.error(err)
    });
  }

  loadPrestations(): void {
    if (!this.dossierId) return;
    
    this.prestationService['http'].get<any>(`${this.prestationService['apiUrl']}/search?dossier.id=${this.dossierId}`).subscribe({
      next: (res) => {
        this.prestations = res.content || [];
      },
      error: (err) => console.error(err)
    });
  }

  loadTypesOfService(): void {
    this.typeOfService.getAll().subscribe({
      next: (res: any) => {
        this.typesOfService = res.content || [];
      },
      error: (err) => console.error(err)
    });
  }

  openAddModal(): void {
    this.editingPrestationId = null;
    this.prestationForm.reset({ nbrOfMinutes: 5 });
    this.selectedDoneByUser = this.currentUser;
    this.showModal = true;
  }

  openEditModal(prestation: InvoiceDossierService): void {
    this.editingPrestationId = prestation.id || null;
    this.prestationForm.patchValue({
      info: prestation.info,
      nbrOfMinutes: prestation.nbrOfMinutes,
      invoiceTypeOfServiceId: prestation.invoiceTypeOfService?.id,
      invoiceDossierServieStatusId: prestation.invoiceDossierServieStatus?.id
    });
    this.selectedDoneByUser = prestation.doneBy || null;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  openUserSelection(): void {
    this.showUserSelectionDialog = true;
  }

  onUserSelectionConfirmed(userIds: string[]): void {
    if (userIds.length > 0) {
      this.selectedDoneByUser = this.users.find(u => String(u.id) === userIds[0]) || null;
    } else {
      this.selectedDoneByUser = null;
    }
    this.showUserSelectionDialog = false;
  }

  onUserSelectionClosed(): void {
    this.showUserSelectionDialog = false;
  }

  assignToMe(): void {
    if (this.currentUser) {
      this.selectedDoneByUser = this.currentUser;
    }
  }

  onSubmit(): void {
    if (this.prestationForm.valid) {
      const formValue = this.prestationForm.value;
      const type = this.typesOfService.find(t => String(t.id) === String(formValue.invoiceTypeOfServiceId));
      const status = this.statuses.find(s => String(s.id) === String(formValue.invoiceDossierServieStatusId));
      
      const newPrestation: InvoiceDossierService = {
        id: this.editingPrestationId || undefined,
        info: formValue.info,
        nbrOfMinutes: formValue.nbrOfMinutes,
        dossier: { id: Number(this.dossierId) } as any,
        invoiceTypeOfService: type,
        invoiceDossierServieStatus: status,
        doneBy: this.selectedDoneByUser || undefined
      };

      if (this.editingPrestationId) {
        this.prestationService.update(newPrestation).subscribe({
          next: () => {
            this.alertService.success('Prestation mise à jour avec succès');
            this.closeModal();
            this.loadPrestations();
          },
          error: (err) => {
            console.error(err);
            this.alertService.displayMessage('Erreur', 'Impossible de mettre à jour la prestation', 'error');
          }
        });
      } else {
        this.prestationService.create(newPrestation).subscribe({
          next: () => {
            this.alertService.success('Prestation ajoutée avec succès');
            this.closeModal();
            this.loadPrestations();
          },
          error: (err) => {
            console.error(err);
            this.alertService.displayMessage('Erreur', 'Impossible d\'ajouter la prestation', 'error');
          }
        });
      }
    }
  }

  deletePrestation(id: number | undefined): void {
    if (!id) return;
    this.alertService.confirmMessage('Supprimer', 'Voulez-vous vraiment supprimer cette prestation ?', 'warning').then(confirmed => {
      if (confirmed) {
        this.prestationService.delete(id).subscribe({
          next: () => {
            this.alertService.success('Prestation supprimée');
            this.loadPrestations();
          },
          error: (err) => console.error(err)
        });
      }
    });
  }
}
