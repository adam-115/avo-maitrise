import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ContactTypeCreation, DossierContact } from './../../appTypes';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact-dialog',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-dialog.html',
  styleUrl: './contact-dialog.css'
})
export class ContactDialog {
  contactTypeCreation = ContactTypeCreation;

  selectedContactTypeCreation = ContactTypeCreation.NOUVEAU;

  @Input() dossierId: string = '';
  @Output() contactCreated = new EventEmitter<DossierContact>();
  @Output() closeContactDialog = new EventEmitter<void>();


  contactForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      civilite: ['M.', Validators.required],
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephoneMobile: [''],
      telephoneFixe: [''],
      entreprise: [''],
      notes: ['', Validators.required] // Rôle dans le dossier
    });
  }



  closeDialog() {
    this.closeContactDialog.emit();
  }

  submitForm() {
    if (this.contactForm.valid) {
      const value = this.contactForm.value;
      alert(this.dossierId);
      const newContact: DossierContact = {
        dossierId: this.dossierId,
        civilite: value.civilite,
        nom: value.nom,
        prenom: value.prenom,
        email: value.email,
        telephoneMobile: value.telephoneMobile,
        telephoneFixe: value.telephoneFixe,
        entreprise: value.entreprise,
        notes: value.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.contactCreated.emit(newContact);
    }
  }

}
