import { ContactDialog } from './../contact-dialog/contact-dialog';
import { Component, inject, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { DossierContact } from '../../appTypes';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { DossierContactService } from '../../services/dossier-contact.service';
import { AlertService } from '../../services/alert-service';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';

@Component({
  selector: 'app-contact',
  imports: [ContactDialog, FormsModule, CommonModule, TranslatePipe],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent implements OnInit, OnChanges {

  @Input() dossierID: string = '';
  @Input() dossierNumber: string = '';
  contacts: DossierContact[] = [];
  searchTerm: string = '';
  showDialog = false;
  viewedContact: DossierContact | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 6;

  private contactService = inject(DossierContactService);
  private alertService = inject(AlertService);

  ngOnInit() {
    this.loadContacts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dossierID'] && !changes['dossierID'].firstChange) {
      this.currentPage = 1;
      this.loadContacts();
    }
  }

  get filteredContacts(): DossierContact[] {
    if (!this.searchTerm.trim()) return this.contacts;
    const term = this.searchTerm.toLowerCase();
    return this.contacts.filter(c => 
      (c.nom && c.nom.toLowerCase().includes(term)) || 
      (c.prenom && c.prenom.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.entreprise && c.entreprise.toLowerCase().includes(term)) ||
      (c.numToque && c.numToque.toLowerCase().includes(term)) ||
      (c.notes && c.notes.toLowerCase().includes(term)) ||
      (c.profession && c.profession.toLowerCase().includes(term)) ||
      (c.pays && c.pays.toLowerCase().includes(term)) ||
      (c.observation && c.observation.toLowerCase().includes(term))
    );
  }

  get paginatedContacts(): DossierContact[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredContacts.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredContacts.length / this.pageSize);
  }

  get currentEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredContacts.length);
  }

  onSearchChange() {
    this.currentPage = 1;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  loadContacts() {
    if (!this.dossierID) return;
    this.contactService.getByDossierId(this.dossierID, 0, 1000).subscribe((data: PaginatedResponse<DossierContact>) => {
      this.contacts = data.content;
    });
  }

  addContact(contact: DossierContact) {
    this.contactService.create(contact).subscribe(() => {
      this.loadContacts();
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
        this.loadContacts();
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
