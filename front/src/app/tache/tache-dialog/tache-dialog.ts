import { Component } from '@angular/core';

@Component({
  selector: 'app-tache-dialog',
  imports: [],
  templateUrl: './tache-dialog.html',
  styleUrl: './tache-dialog.css'
})
export class TacheDialog {
  showModal = false;

  openModal() {
    this.showModal = true;
  }
  closeModal() {
    this.showModal = false;
  }

}
