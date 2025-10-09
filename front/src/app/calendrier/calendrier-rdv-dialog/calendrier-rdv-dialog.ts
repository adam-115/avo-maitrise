import { Component } from '@angular/core';

@Component({
  selector: 'app-calendrier-rdv-dialog',
  imports: [],
  templateUrl: './calendrier-rdv-dialog.html',
  styleUrl: './calendrier-rdv-dialog.css'
})
export class CalendrierRdvDialog {

  showDialog = false;

  openDialog() {
    this.showDialog = true;
  }
  closeDialog() {
    this.showDialog = false;
  }

}
