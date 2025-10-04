import { ContactDialog } from './../contact-dialog/contact-dialog';
import { Component, ViewChild } from '@angular/core';

@Component({
  selector: 'app-contact',
  imports: [ContactDialog],
  templateUrl: './contact.html',
  styleUrl: './contact.css'
})
export class Contact {

  @ViewChild(ContactDialog)
  contactDialog!: ContactDialog;

  openDialog() {
    this.contactDialog.openDialog();
  }
  closeDialog() {
    this.contactDialog.closeDialog();
  }

}
