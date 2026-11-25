import { Component, EventEmitter, HostListener, inject, OnInit, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AppointementService } from '../../services/appointement.service';
import { ClientService } from '../../services/client-service';
import { DossierService } from '../../services/dossier.service';
import { Appointement, Client, Dossier } from '../../appTypes';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { ClientSelectionDialog } from '../../dossier/client-selection-dialog/client-selection-dialog';
import { DossierSelectionDialog } from '../../dossier/dossier-selection-dialog/dossier-selection-dialog';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-appointement-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ClientSelectionDialog, DossierSelectionDialog, TranslatePipe],
  templateUrl: './appointement-dialog.html',
  styleUrl: './appointement-dialog.css'
})
export class AppointementDialogComponent implements OnInit {

  @Output() onSave = new EventEmitter<void>();
  @Output() onClose = new EventEmitter<void>();

  @Input() selectedAppointement: Appointement | null = null;
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
  submitError: string | null = null;
  validationSummary: string | null = null;

  readonly quickDurations = [
    { label: '30 min', minutes: 30 },
    { label: '1h', minutes: 60 },
    { label: '1h30', minutes: 90 },
    { label: '2h', minutes: 120 }
  ];

  readonly quickLocations = ['Cabinet', 'Visioconférence', 'Tribunal'];

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (!this.showClientDialog && !this.showDossierDialog) {
      this.closeDialog();
    }
  }

  get isEditMode(): boolean {
    return !!this.selectedAppointement;
  }

  get currentDurationMinutes(): number | null {
    const start = this.appointementForm?.get('time')?.value;
    const end = this.appointementForm?.get('endTime')?.value;
    if (!start || !end) return null;
    const diff = this.toMinutes(end) - this.toMinutes(start);
    return diff > 0 ? diff : null;
  }

  getDisplayName(client: any): string {
    if (!client) return '';
    return `${client.nom || client.nomCommercial || ''} ${client.prenom || ''}`.trim();
  }

  getClientInitials(): string {
    const name = this.getSelectedClientName();
    if (!name) return 'CL';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
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

  removeClient(event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedClient = null;
    this.appointementForm.patchValue({ clientId: null });
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

  removeDossier(event?: Event): void {
    if (event) event.stopPropagation();
    this.appointementForm.patchValue({ dossierId: null });
  }

  getSelectedDossierName(): string {
    const dossierId = this.appointementForm.get('dossierId')?.value;
    if (!dossierId) return '';
    const dossier = this.dossiers.find(d => String(d.id) === String(dossierId));
    return dossier ? `${dossier.titre} (${dossier.referenceInterne})` : '';
  }

  setStatus(status: 'Standard' | 'Urgent' | 'Reporté'): void {
    this.appointementForm.patchValue({ status });
  }

  setQuickLocation(location: string): void {
    this.appointementForm.patchValue({ location });
    this.appointementForm.get('location')?.markAsTouched();
  }

  applyDuration(minutes: number): void {
    const start = this.appointementForm.get('time')?.value || '09:00';
    if (!this.appointementForm.get('time')?.value) {
      this.appointementForm.patchValue({ time: start });
    }
    const endMinutes = Math.min(this.toMinutes(start) + minutes, 23 * 60 + 55);
    this.appointementForm.patchValue({ endTime: this.fromMinutes(endMinutes) });
    this.appointementForm.get('endTime')?.markAsTouched();
  }

  onStartTimeChange(): void {
    const start = this.appointementForm.get('time')?.value;
    const end = this.appointementForm.get('endTime')?.value;
    if (start && (!end || this.toMinutes(end) <= this.toMinutes(start))) {
      const nextEnd = Math.min(this.toMinutes(start) + 60, 23 * 60 + 55);
      this.appointementForm.patchValue({ endTime: this.fromMinutes(nextEnd) });
    }
  }

  ngOnInit(): void {
    this.initForm();
    this.loadData();
  }

  private todayIso(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  private fromMinutes(total: number): string {
    const h = Math.floor(total / 60) % 24;
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private timeRangeValidator = (group: AbstractControl): ValidationErrors | null => {
    const start = group.get('time')?.value;
    const end = group.get('endTime')?.value;
    if (start && end && this.toMinutes(end) <= this.toMinutes(start)) {
      return { invalidTimeRange: true };
    }
    return null;
  };

  initForm(): void {
    const defaultStart = this.initialTime || '09:00';
    const defaultEnd = this.fromMinutes(Math.min(this.toMinutes(defaultStart) + 60, 23 * 60 + 55));

    this.appointementForm = this.fb.group({
      title: ['', Validators.required],
      date: [this.initialDate || this.todayIso(), Validators.required],
      time: [defaultStart, Validators.required],
      endTime: [defaultEnd, Validators.required],
      location: ['', Validators.required],
      status: ['Standard', Validators.required],
      clientId: [''],
      dossierId: [''],
      clientCase: ['']
    }, { validators: this.timeRangeValidator });

    if (this.selectedAppointement) {
      this.appointementForm.patchValue(this.selectedAppointement);
      if (this.selectedAppointement.clientId) {
        this.clientService.findById(this.selectedAppointement.clientId).subscribe(client => {
          this.selectedClient = client;
        });
      }
    }
  }

  loadData(): void {
    this.dossierService.getAll().subscribe((dossiers: PaginatedResponse<Dossier>) => {
      this.dossiers = dossiers.content || [];
    });
  }

  private buildValidationSummary(): string {
    const labels: Record<string, string> = {
      title: 'Objet / Titre',
      date: 'Date',
      time: 'Heure de début',
      endTime: 'Heure de fin',
      location: 'Lieu',
      status: 'Statut'
    };
    const missing = Object.keys(labels)
      .filter(k => this.appointementForm.get(k)?.invalid)
      .map(k => labels[k]);

    if (this.appointementForm.hasError('invalidTimeRange')) {
      missing.push('Heure de fin postérieure au début');
    }
    return missing.length > 0
      ? `Champs obligatoires ou invalides : ${missing.join(', ')}.`
      : 'Veuillez vérifier les champs obligatoires.';
  }

  save(): void {
    this.submitError = null;
    this.validationSummary = null;

    if (this.appointementForm.invalid) {
      this.appointementForm.markAllAsTouched();
      this.validationSummary = this.buildValidationSummary();
      return;
    }

    this.isLoading = true;
    const formValue = { ...this.appointementForm.value };

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

    const request$ = this.selectedAppointement
      ? this.appointementService.update({ ...this.selectedAppointement, ...formValue })
      : this.appointementService.create(formValue);

    request$.subscribe({
      next: () => {
        this.isLoading = false;
        this.onSave.emit();
        this.closeDialog();
      },
      error: (err) => {
        console.error('Failed to save appointement', err);
        this.submitError = 'Impossible d\'enregistrer le rendez-vous. Veuillez réessayer.';
        this.isLoading = false;
      }
    });
  }

  closeDialog(): void {
    this.submitError = null;
    this.validationSummary = null;
    this.appointementForm.reset({ status: 'Standard' });
    this.onClose.emit();
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.appointementForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
