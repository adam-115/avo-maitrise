import { ContactDialog } from './../contact-dialog/contact-dialog';
import { Component, inject, Input, OnInit, ViewChild } from '@angular/core';
import { DossierContact } from '../../appTypes';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DossierContactService } from '../../services/dossier-contact.service';
import { AlertService } from '../../services/alert-service';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';

@Component({
  selector: 'app-contact',
  imports: [ContactDialog, FormsModule, CommonModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent implements OnInit {


  @Input() dossierID: string = '';
  @Input() dossierNumber: string = '';
  contacts: DossierContact[] = [];
  searchTerm: string = '';
  showDialog = false;
  viewedContact: DossierContact | null = null;


  private contactService = inject(DossierContactService);
  private alertService = inject(AlertService);

  ngOnInit() {
    this.loadContacts();
  }

  get filteredContacts() {
    if (!this.searchTerm.trim()) return this.contacts;
    const term = this.searchTerm.toLowerCase();
    return this.contacts.filter(c => 
      c.nom?.toLowerCase().includes(term) || 
      c.prenom?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.entreprise?.toLowerCase().includes(term) ||
      c.numToque?.toLowerCase().includes(term) ||
      c.notes?.toLowerCase().includes(term) ||
      c.profession?.toLowerCase().includes(term) ||
      c.pays?.toLowerCase().includes(term) ||
      c.observation?.toLowerCase().includes(term)
    );
  }

  loadContacts() {
    if (!this.dossierID) return;
    this.contactService.getAll().subscribe((data: PaginatedResponse<DossierContact>) => {
      this.contacts = data.content.filter(c => String(c.dossierId) === String(this.dossierID));
    });
  }

  addContact(contact: DossierContact) {
    this.contactService.create(contact).subscribe(newContact => {
      this.contacts.push(newContact);
      this.closeContactdialog();
      this.alertService.success('Le contact a été ajouté avec succès au dossier.');
    });
  }

  async deleteContact(id?: number | string) {
    if (!id) return;

    const confirm = await this.alertService.confirmMessage(
      'Supprimer ce contact ?',
      'Êtes-vous sûr de vouloir enlever ce contact du dossier ? Cette action est irréversible.',
      'warning'
    );

    if (confirm) {
      this.contactService.delete(id).subscribe(() => {
        this.contacts = this.contacts.filter(c => c.id !== id);
        this.alertService.success('Le contact a été retiré du dossier.');
      });
    }
  }


  openContactdialog() {
    this.showDialog = true;
  }

  closeContactdialog() {
    this.showDialog = false;
  }

  viewContactDetails(contact: DossierContact) {
    this.viewedContact = contact;
  }

  closeViewModal() {
    this.viewedContact = null;
  }
}
