import { Component } from '@angular/core';

@Component({
  selector: 'app-temp-dialog',
  imports: [],
  templateUrl: './temp-dialog.html',
  styleUrl: './temp-dialog.css'
})
export class TempDialog {

  showModal = false;

  openModal() {
    this.showModal = true;
  }
  closeModal() {
    this.showModal = false;
  }

}
