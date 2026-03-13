import { Component, EventEmitter, inject, OnInit, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppointementService } from '../../services/appointement.service';
import { ClientService } from '../../services/client-service';
import { DossierService } from '../../services/dossier.service';
import { Appointement, Client, Dossier } from '../../appTypes';

@Component({
  selector: 'app-appointement-dialog',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './appointement-dialog.html',
  styleUrl: './appointement-dialog.css'
})
export class AppointementDialogComponent implements OnInit {

  @Output() onSave = new EventEmitter<void>();
  @Output() onClose = new EventEmitter<void>();

  @Input() initialDate?: string;
  @Input() initialTime?: string;

  private fb = inject(FormBuilder);
  private appointementService = inject(AppointementService);
  private clientService = inject(ClientService);
  private dossierService = inject(DossierService);

  appointementForm!: FormGroup;
  clients: Client[] = [];
  dossiers: Dossier[] = [];
  isLoading = false;

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
  }

  loadData() {
    this.clientService.getAll().subscribe(clients => this.clients = clients);
    this.dossierService.getAll().subscribe(dossiers => this.dossiers = dossiers);
  }

  save() {
    alert("start saving ");
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
      } else if (formValue.clientId) {
        const client = this.clients.find(c => String(c.id) === String(formValue.clientId));
        if (client) formValue.clientCase = `${client.nom} ${client.prenom}`;
      } else {
        formValue.clientCase = formValue.title;
      }
    }

    const newAppointement: Appointement = {
      // Mock ID generation for db.json if needed, though usually json-server handles it.
      // We send it without ID to create. The type says id is mandatory, but for json-server we omit it or pass a random number.
      id: Date.now(),
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

  closeDialog() {
    this.appointementForm.reset({ status: 'Standard' });
    this.onClose.emit();
  }
}
