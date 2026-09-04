import { Component, EventEmitter, Input, OnInit, OnChanges, Output, SimpleChanges } from '@angular/core';
import { DossierContact } from './../../appTypes';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact-dialog',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './contact-dialog.html',
  styleUrl: './contact-dialog.css'
})
export class ContactDialog implements OnInit, OnChanges {
  @Input() dossierId: string = '';
  @Input() dossierNumber: string = '';
  @Input() contactToEdit: DossierContact | null = null;
  @Output() contactCreated = new EventEmitter<DossierContact>();
  @Output() contactUpdated = new EventEmitter<DossierContact>();
  @Output() closeContactDialog = new EventEmitter<void>();

  contactForm: FormGroup;
  isSubmitting = false;

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      civilite: ['M.', Validators.required],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required]],
      notes: ['Partie Adverse', Validators.required], // Role in matter
      entreprise: [''],
      email: ['', [Validators.required, Validators.email]],
      telephoneMobile: [''],
      telephoneFixe: [''],
      adresse: [''],
      profession: [''],
      pays: [''],
      numToque: [''],
      siteWeb: [''],
      observation: ['']
    });
  }

  ngOnInit(): void {
    this.populateForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contactToEdit']) {
      this.populateForm();
    }
  }

  private populateForm(): void {
    if (this.contactToEdit) {
      this.contactForm.patchValue({
        civilite: this.contactToEdit.civilite || 'M.',
        nom: this.contactToEdit.nom || '',
        prenom: this.contactToEdit.prenom || '',
        notes: this.contactToEdit.notes || 'Partie Adverse',
        entreprise: this.contactToEdit.entreprise || '',
        email: this.contactToEdit.email || '',
        telephoneMobile: this.contactToEdit.telephoneMobile || '',
        telephoneFixe: this.contactToEdit.telephoneFixe || '',
        adresse: this.contactToEdit.adresse || '',
        profession: this.contactToEdit.profession || '',
        pays: this.contactToEdit.pays || '',
        numToque: this.contactToEdit.numToque || '',
        siteWeb: this.contactToEdit.siteWeb || '',
        observation: this.contactToEdit.observation || ''
      });
    } else {
      this.contactForm.reset({
        civilite: 'M.',
        nom: '',
        prenom: '',
        notes: 'Partie Adverse',
        entreprise: '',
        email: '',
        telephoneMobile: '',
        telephoneFixe: '',
        adresse: '',
        profession: '',
        pays: '',
        numToque: '',
        siteWeb: '',
        observation: ''
      });
    }
  }

  get isEditMode(): boolean {
    return !!(this.contactToEdit && this.contactToEdit.id);
  }

  closeDialog() {
    this.closeContactDialog.emit();
  }

  submitForm() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const value = this.contactForm.value;

    if (this.isEditMode && this.contactToEdit) {
      const updatedContact: DossierContact = {
        ...this.contactToEdit,
        ...value,
        dossierId: this.dossierId || this.contactToEdit.dossierId,
        updatedAt: new Date()
      };
      this.contactUpdated.emit(updatedContact);
    } else {
      const newContact: DossierContact = {
        ...value,
        dossierId: this.dossierId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.contactCreated.emit(newContact);
    }
  }
}
