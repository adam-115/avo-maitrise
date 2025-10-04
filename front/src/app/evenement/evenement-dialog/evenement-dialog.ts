import { Component } from '@angular/core';

@Component({
  selector: 'app-evenement-dialog',
  imports: [],
  templateUrl: './evenement-dialog.html',
  styleUrl: './evenement-dialog.css'
})
export class EvenementDialog {
  showModal = false;

  openModal() {
    this.showModal = true;
  }
  closeModal() {
    this.showModal = false;
  }

}
