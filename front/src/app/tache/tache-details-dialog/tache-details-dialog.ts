import { Component } from '@angular/core';

@Component({
  selector: 'app-tache-details-dialog',
  imports: [],
  templateUrl: './tache-details-dialog.html',
  styleUrl: './tache-details-dialog.css'
})
export class TacheDetailsDialog {
  showModal = false;

  openModal() {
    this.showModal = true;
  }
  closeModal() {
    this.showModal = false;
  }

}
