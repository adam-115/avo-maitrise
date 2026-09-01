import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DossierService } from '../../services/dossier.service';
import { ClientService } from '../../services/client-service';
import { StatutDossierService } from '../../services/statut-dossier.service';
import { DossierPrioriteService } from '../../services/dossier-priorite.service';
import { UserService } from '../../services/user.service';
import { DomaineJuridiqueService } from '../../services/domaine-juridique.service';
import { Client, StatutDossier, DossierPriorite, User, Dossier, Document, DomaineJuridique } from '../../appTypes';
import { CommonModule } from '@angular/common';
import { ClientSelectionDialog } from '../client-selection-dialog/client-selection-dialog';
import { UserSelectionDialog } from '../user-selection-dialog/user-selection-dialog';
import { DocumentDialog } from '../../document/document-dialog/document-dialog';
import { DomaineJuridiqueSelectionDialog } from '../domaine-juridique-selection-dialog/domaine-juridique-selection-dialog';
import { ClientStatusAlertComponent } from '../../shared/components/client-status-alert/client-status-alert.component';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { forkJoin } from 'rxjs';
import { AlertService } from '../../services/alert-service';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';

@Component({
  selector: 'app-dossier-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, UserSelectionDialog, ClientSelectionDialog, DocumentDialog, DomaineJuridiqueSelectionDialog, ClientStatusAlertComponent, TranslatePipe, TranslateDirective],
  templateUrl: './dossier-form.html',
  styleUrl: './dossier-form.css'
})
export class DossierForm implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dossierService = inject(DossierService);
  private clientService = inject(ClientService);
  private statusService = inject(StatutDossierService);
  private priorityService = inject(DossierPrioriteService);
  private userService = inject(UserService);
  private domaineService = inject(DomaineJuridiqueService);
  private alertService = inject(AlertService);

  dossierForm: FormGroup;
  isEditMode = false;
  dossierId: string | number | null = null;
  loading = true;

  selectedClient: Client | null = null;
  statuses: StatutDossier[] = [];
  priorities: DossierPriorite[] = [];
  users: User[] = [];
  domaines: DomaineJuridique[] = [];

  showUserDialog = false;
  showClientDialog = false;
  showResponsableDialog = false;
  showDocumentDialog = false;
  showDomaineDialog = false;

  constructor() {
    this.dossierForm = this.fb.group({
      referenceInterne: ['', Validators.required],
      titre: ['', Validators.required],
      description: [''],
      clientId: ['', Validators.required],
      responsableId: ['', Validators.required],
      intervenantsIds: [[]],
      domaineJuridique: ['', Validators.required],
      prioriteID: ['', Validators.required],
      statutID: ['', Validators.required],
      dateOuverture: [new Date().toISOString().substring(0, 10), Validators.required],
      methodeFacturation: ['HORAIRE', Validators.required],
      budgetEstime: [0],
      tauxHoraireApplique: [0],
      tags: [[]],
      documents: [[]]
    });

    this.dossierForm.valueChanges.subscribe(() => {
      if (this.dossierForm.dirty) {
        this.dossierForm.markAllAsTouched();
      }
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      const clientId = this.route.snapshot.queryParamMap.get('clientId');
      this.loading = true;

      const requests: any = {
        statuses: this.statusService.getAll(),
        priorities: this.priorityService.getAll(),
        users: this.userService.getAll(),
        domaines: this.domaineService.getAll()
      };

      if (id) {
        this.isEditMode = true;
        this.dossierId = id;
        requests.dossier = this.dossierService.findById(id);
      } else if (clientId) {
        requests.client = this.clientService.findById(clientId);
      }

      forkJoin(requests).subscribe({
        next: (res: any) => {
          this.statuses = res.statuses.content || [];
          this.priorities = res.priorities.content || [];
          this.users = res.users.content || [];
          this.domaines = (res.domaines.content || []).filter((d: any) => d.active);

          if (res.dossier) {
            const dossier = res.dossier;
            this.dossierForm.patchValue({
              ...dossier,
              dateOuverture: dossier.dateOuverture ? new Date(dossier.dateOuverture).toISOString().substring(0, 10) : '',
            });
            if (dossier.client?.id || dossier.clientId) {
              const cid = dossier.client?.id || dossier.clientId;
              this.clientService.findById(cid).subscribe(client => {
                this.selectedClient = client;
                this.dossierForm.patchValue({ clientId: client.id });
                this.checkClientStatus();
              });
            }
          } else if (res.client) {
             this.selectedClient = res.client;
             this.dossierForm.patchValue({ clientId: res.client.id });
             this.checkClientStatus();
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading dossier form dependencies', err);
          this.loading = false;
        }
      });
    });
  }

  checkClientStatus(): void {
    if (this.isClientBlocked) {
      this.dossierForm.disable();
    } else {
      this.dossierForm.enable();
    }
  }

  get isClientBlocked(): boolean {
    return this.getSelectedClientStatus() === 'BLOCKED';
  }

  // Client Selection Dialog Methods
  openClientDialog(): void {
    this.showClientDialog = true;
  }

  closeClientDialog(): void {
    this.showClientDialog = false;
  }

  onClientSelected(client: Client): void {
    this.selectedClient = client;
    this.dossierForm.patchValue({ clientId: client.id });
    this.checkClientStatus();
    this.closeClientDialog();
  }

  getSelectedClientName(): string {
    const c = this.selectedClient as any;
    return c ? `${c.nom || c.nomCommercial || ''} ${c.prenom || ''}`.trim() : '';
  }

  getSelectedClientStatus(): string | undefined {
    return this.selectedClient?.clientStatus || (this.selectedClient as any)?.status;
  }

  // User Selection Dialog Methods
  openUserDialog(): void {
    this.showUserDialog = true;
  }

  closeUserDialog(): void {
    this.showUserDialog = false;
  }

  onUsersSelected(selectedIds: string[]): void {
    this.dossierForm.patchValue({ intervenantsIds: selectedIds });
    this.closeUserDialog();
  }

  getSelectedIntervenants(): User[] {
    const selectedIds = this.dossierForm.get('intervenantsIds')?.value || [];
    return this.users.filter(user => selectedIds.includes(String(user.id)));
  }

  removeIntervenant(userId: string | number): void {
    const currentIds = this.dossierForm.get('intervenantsIds')?.value || [];
    const newIds = currentIds.filter((id: string | number) => String(id) !== String(userId));
    this.dossierForm.patchValue({ intervenantsIds: newIds });
  }

  // Domaine Juridique Selection Dialog Methods
  openDomaineDialog(): void {
    this.showDomaineDialog = true;
  }

  closeDomaineDialog(): void {
    this.showDomaineDialog = false;
  }

  onDomaineSelected(domaineId: string): void {
    this.dossierForm.patchValue({ domaineJuridique: domaineId });
    this.closeDomaineDialog();
  }

  getSelectedDomaineLabel(): string {
    const domaineId = this.dossierForm.get('domaineJuridique')?.value;
    if (!domaineId) return '';
    const domaine = this.domaines.find(d => d.id == domaineId);
    return domaine ? domaine.label : '';
  }

  getSelectedDomaineColor(): string {
    const domaineId = this.dossierForm.get('domaineJuridique')?.value;
    if (!domaineId) return 'transparent';
    const domaine = this.domaines.find(d => d.id == domaineId);
    return domaine ? (domaine.color || 'transparent') : 'transparent';
  }


  // User Selection Dialog Methods for Responsable
  openResponsableDialog(): void {
    this.showResponsableDialog = true;
  }

  closeResponsableDialog(): void {
    this.showResponsableDialog = false;
  }

  onResponsableSelected(userIds: string[]): void {
    if (userIds.length > 0) {
      this.dossierForm.patchValue({ responsableId: userIds[0] });
    }
    this.closeResponsableDialog();
  }

  getSelectedResponsableName(): string {
    const userId = this.dossierForm.get('responsableId')?.value;
    if (!userId) return '';
    const user = this.users.find(u => u.id == userId);
    return user ? user.username : '';
  }

  // Tags Management
  get tags(): string[] {
    return this.dossierForm.get('tags')?.value || [];
  }

  addTag(event: any): void {
    const input = event.target;
    const value = input.value.trim();

    if (value) {
      const currentTags = this.tags;
      if (!currentTags.includes(value)) {
        this.dossierForm.patchValue({
          tags: [...currentTags, value]
        });
      }
      input.value = '';
    }
  }

  removeTag(index: number): void {
    const currentTags = this.tags;
    this.dossierForm.patchValue({
      tags: currentTags.filter((_, i) => i !== index)
    });
  }

  // Documents Management
  get documents(): Document[] {
    return this.dossierForm.get('documents')?.value || [];
  }

  openDocumentDialog(): void {
    this.showDocumentDialog = true;
  }

  closeDocumentDialog(): void {
    this.showDocumentDialog = false;
  }

  onDocumentAdded(doc: Document): void {
    this.dossierForm.patchValue({
      documents: [...this.documents, doc]
    });
    this.closeDocumentDialog();
  }

  removeDocument(index: number): void {
    const currentDocs = this.documents;
    this.dossierForm.patchValue({
      documents: currentDocs.filter((_, i) => i !== index)
    });
  }

  async onSubmit(): Promise<void> {
    if (this.dossierForm.invalid) {
      return;
    }

    const dossierData: Dossier = {
      ...this.dossierForm.value,
      client: { id: this.dossierForm.value.clientId },
      id: this.dossierId,
      updated_at: new Date()
    };

    if (this.isEditMode && this.dossierId) {
      const confirmed = await this.alertService.confirmMessage(
        'Modifier le dossier',
        'Êtes-vous sûr de vouloir enregistrer les modifications apportées à ce dossier ?',
        'warning'
      );
      if (confirmed) {
        this.dossierService.update(dossierData).subscribe(() => {
          this.navigateToDossier();
        });
      }
    } else {
      this.dossierService.create(dossierData).subscribe(() => {
        this.navigateToDossier();
      });
    }
  }

  onCancel(): void {
    this.navigateToDossier();
  }

  navigateToDossier() {
    this.router.navigateByUrl('/home/dossier');
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.dossierForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
