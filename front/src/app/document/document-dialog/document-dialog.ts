import { Component } from '@angular/core';

@Component({
  selector: 'app-document-dialog',
  imports: [],
  templateUrl: './document-dialog.html',
  styleUrl: './document-dialog.css'
})
export class DocumentDialog {
  showModal = false;

  openModal() {
    this.showModal = true;
  }
  closeModal() {
    this.showModal = false;
  }
}
