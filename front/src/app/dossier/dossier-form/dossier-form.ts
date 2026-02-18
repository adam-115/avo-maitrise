import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DossierService } from '../../services/dossier.service';
import { ClientService } from '../../services/client-service';
import { MatterStatusService } from '../../services/statut-dossier.service';
import { DossierPrioriteService } from '../../services/dossier-priorite.service';
import { UserService } from '../../services/user.service';
import { DomaineJuridiqueService } from '../../services/domaine-juridique.service';
import { Client, StatutDossier, DossierPriorite, User, Dossier, Document, DomaineJuridique } from '../../appTypes';
import { CommonModule } from '@angular/common';
import { ClientSelectionDialog } from '../client-selection-dialog/client-selection-dialog';
import { UserSelectionDialog } from '../user-selection-dialog/user-selection-dialog';
import { DocumentDialog } from '../../document/document-dialog/document-dialog';
import { DomaineJuridiqueSelectionDialog } from '../domaine-juridique-selection-dialog/domaine-juridique-selection-dialog';

@Component({
  selector: 'app-dossier-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UserSelectionDialog, ClientSelectionDialog, DocumentDialog, DomaineJuridiqueSelectionDialog],
  templateUrl: './dossier-form.html',
  styleUrl: './dossier-form.css'
})
export class DossierForm implements OnInit {
  dossierForm: FormGroup;
  isEditMode = false;
  dossierId: number | null = null;

  clients: Client[] = [];
  statuses: StatutDossier[] = [];
  priorities: DossierPriorite[] = [];
  users: User[] = [];
  domaines: DomaineJuridique[] = [];

  showUserDialog = false;
  showClientDialog = false;
  showResponsableDialog = false;
  showDocumentDialog = false;
  showDomaineDialog = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private dossierService: DossierService,
    private clientService: ClientService,
    private statusService: MatterStatusService,
    private priorityService: DossierPrioriteService,
    private userService: UserService,
    private domaineService: DomaineJuridiqueService
  ) {
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
  }

  ngOnInit(): void {
    this.loadDependencies();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.dossierId = +id;
        this.loadDossier(this.dossierId);
      }
    });
  }

  loadDependencies(): void {
    this.clientService.getAll().subscribe(data => this.clients = data);
    this.statusService.getAll().subscribe(data => this.statuses = data);
    this.priorityService.getAll().subscribe(data => this.priorities = data);
    this.userService.getAll().subscribe(data => this.users = data);
    this.domaineService.getAll().subscribe(data => this.domaines = data.filter(d => d.active));
  }

  loadDossier(id: number): void {
    this.dossierService.findById(id).subscribe(dossier => {
      this.dossierForm.patchValue({
        ...dossier,
        dateOuverture: dossier.dateOuverture ? new Date(dossier.dateOuverture).toISOString().substring(0, 10) : '',
      });
    });
  }

  // Client Selection Dialog Methods
  openClientDialog(): void {
    this.showClientDialog = true;
  }

  closeClientDialog(): void {
    this.showClientDialog = false;
  }

  onClientSelected(clientId: string | number): void {
    this.dossierForm.patchValue({ clientId: clientId });
    this.closeClientDialog();
  }

  getSelectedClientName(): string {
    const clientId = this.dossierForm.get('clientId')?.value;
    if (!clientId) return '';
    const client = this.clients.find(c => c.id == clientId);
    return client ? `${client.nom || ''} ${client.prenom || ''}`.trim() : '';
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

  onSubmit(): void {
    if (this.dossierForm.invalid) {
      return;
    }

    const dossierData: Dossier = {
      ...this.dossierForm.value,
      updated_at: new Date()
    };

    if (this.isEditMode && this.dossierId) {
      this.dossierService.update(this.dossierId, dossierData).subscribe(() => {
        this.navigateToDossier();
      });
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
}
