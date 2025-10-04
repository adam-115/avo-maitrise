import { Component } from '@angular/core';
import { ContactTypeCreation } from './../../appTypes';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact-dialog',
  imports: [CommonModule],
  templateUrl: './contact-dialog.html',
  styleUrl: './contact-dialog.css'
})
export class ContactDialog {
  showDialog = false;
  contactTypeCreation = ContactTypeCreation;

  selectedContactTypeCreation = ContactTypeCreation.EXISTANT;

  openDialog() {
    this.showDialog = true;
  }
  closeDialog() {
    this.showDialog = false;
  }

}
