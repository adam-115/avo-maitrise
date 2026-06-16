import { Component, EventEmitter, inject, OnInit, Output, Input, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppointementService } from '../../services/appointement.service';
import { ClientService } from '../../services/client-service';
import { DossierService } from '../../services/dossier.service';
import { Appointement, Client, Dossier } from '../../appTypes';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { ClientSelectionDialog } from '../../dossier/client-selection-dialog/client-selection-dialog';
import { DossierSelectionDialog } from '../../dossier/dossier-selection-dialog/dossier-selection-dialog';

@Component({
  selector: 'app-appointement-dialog',
  imports: [CommonModule, ReactiveFormsModule, ClientSelectionDialog, DossierSelectionDialog],
  templateUrl: './appointement-dialog.html',
  styleUrl: './appointement-dialog.css'
})
export class AppointementDialogComponent implements OnInit {

  @Output() onSave = new EventEmitter<void>();
  @Output() onClose = new EventEmitter<void>();

  @Input()
  selectedAppointement: Appointement | null = null;

  @Input() initialDate?: string;
  @Input() initialTime?: string;

  private fb = inject(FormBuilder);
  private appointementService = inject(AppointementService);
  private clientService = inject(ClientService);
  private dossierService = inject(DossierService);

  appointementForm!: FormGroup;
  selectedClient: Client | null = null;
  dossiers: Dossier[] = [];
  isLoading = false;
  showClientDialog = false;
  showDossierDialog = false;

  getDisplayName(client: any): string {
    if (!client) return '';
    return `${client.nom || client.nomCommercial || ''} ${client.prenom || ''}`.trim();
  }

  openClientDialog(): void {
    this.showClientDialog = true;
  }

  closeClientDialog(): void {
    this.showClientDialog = false;
  }

  onClientSelected(client: Client): void {
    this.selectedClient = client;
    this.appointementForm.patchValue({ clientId: client.id });
    this.closeClientDialog();
  }

  getSelectedClientName(): string {
    const c = this.selectedClient as any;
    return c ? `${c.nom || c.nomCommercial || ''} ${c.prenom || ''}`.trim() : '';
  }

  openDossierDialog(): void {
    this.showDossierDialog = true;
  }

  closeDossierDialog(): void {
    this.showDossierDialog = false;
  }

  onDossierSelected(dossierId: string | number): void {
    this.appointementForm.patchValue({ dossierId: dossierId });
    this.closeDossierDialog();
  }

  getSelectedDossierName(): string {
    const dossierId = this.appointementForm.get('dossierId')?.value;
    if (!dossierId) return '';
    const dossier = this.dossiers.find(d => d.id == dossierId);
    return dossier ? `${dossier.titre} (${dossier.referenceInterne})` : '';
  }

  ngOnInit() {
    this.initForm();
    this.loadData();
  }

  initForm() {
    this.appointementForm = this.fb.group({
      title: ['', Validators.required],
      date: [this.initialDate || '', Validators.required],
      time: [this.initialTime || '', Validators.required],
      endTime: ['', Validators.required],
      location: ['', Validators.required],
      status: ['Standard', Validators.required],
      clientId: [''],
      dossierId: [''],
      clientCase: [''] // Helper for standard display
    });

    this.appointementForm.valueChanges.subscribe(() => {
      if (this.appointementForm.dirty) {
        this.appointementForm.markAllAsTouched();
      }
    });

    if (this.selectedAppointement) {
      this.appointementForm.patchValue(this.selectedAppointement);
      if (this.selectedAppointement.clientId) {
        this.clientService.findById(this.selectedAppointement.clientId).subscribe(client => {
          this.selectedClient = client;
        });
      }
    }
  }

  loadData() {
    this.dossierService.getAll().subscribe((dossiers: PaginatedResponse<Dossier>) => this.dossiers = dossiers.content);
  }

  save() {
    if (this.appointementForm.invalid) {
      this.appointementForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.appointementForm.value;

    // Auto-fill clientCase if not provided, for backwards compatibility
    if (!formValue.clientCase) {
      if (formValue.dossierId) {
        const dossier = this.dossiers.find(d => String(d.id) === String(formValue.dossierId));
        if (dossier) formValue.clientCase = dossier.titre;
      } else if (this.selectedClient) {
        formValue.clientCase = this.getDisplayName(this.selectedClient);
      } else {
        formValue.clientCase = formValue.title;
      }
    }

    if (this.selectedAppointement) {
      const updatedAppointement: Appointement = {
        ...this.selectedAppointement,
        ...formValue
      };
      this.appointementService.update(updatedAppointement).subscribe({
        next: () => {
          this.isLoading = false;
          this.onSave.emit();
          this.closeDialog();
        },
        error: (err) => {
          console.error('Failed to update appointement', err);
          this.isLoading = false;
          // Ideally show an error notification here
        }
      });
    } else {
      const newAppointement: any = {
        ...formValue
      };

      this.appointementService.create(newAppointement).subscribe({
        next: () => {
          this.isLoading = false;
          this.onSave.emit();
          this.closeDialog();
        },
        error: (err) => {
          console.error('Failed to create appointement', err);
          this.isLoading = false;
          // Ideally show an error notification here
        }
      });
    }
  }

  closeDialog() {
    this.appointementForm.reset({ status: 'Standard' });
    this.onClose.emit();
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.appointementForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
