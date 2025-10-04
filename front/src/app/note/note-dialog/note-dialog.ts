import { Component } from '@angular/core';

@Component({
  selector: 'app-note-dialog',
  imports: [],
  templateUrl: './note-dialog.html',
  styleUrl: './note-dialog.css'
})
export class NoteDialog {

  showModal: boolean = false;

  openModal() {
    this.showModal = true;
  }
  closeModal() {
    this.showModal = false;
  }

}
