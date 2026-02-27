import { ContactDialog } from './../contact-dialog/contact-dialog';
import { Component, inject, Input, OnInit, ViewChild } from '@angular/core';
import { DossierContact } from '../../appTypes';
import { DossierContactService } from '../../services/dossier-contact.service';
import { AlertService } from '../../services/alert-service';

@Component({
  selector: 'app-contact',
  imports: [ContactDialog],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent implements OnInit {


  @Input() dossierID: string = '';
  contacts: DossierContact[] = [];

  showDialog = false;


  private contactService = inject(DossierContactService);
  private alertService = inject(AlertService);

  ngOnInit() {
    this.loadContacts();
  }

  loadContacts() {
    this.contactService.getAll().subscribe(contacts => {
      this.contacts = contacts.filter(c => String(c.dossierId) === String(this.dossierID));
    });
  }

  addContact(contact: DossierContact) {
    this.contactService.create(contact).subscribe(newContact => {
      this.contacts.push(newContact);
      this.closeContactdialog();
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


}
