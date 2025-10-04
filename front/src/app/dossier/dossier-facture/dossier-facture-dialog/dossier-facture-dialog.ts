import { Component } from '@angular/core';

@Component({
  selector: 'app-dossier-facture-dialog',
  imports: [],
  templateUrl: './dossier-facture-dialog.html',
  styleUrl: './dossier-facture-dialog.css'
})
export class DossierFactureDialog {

  showDialog = false;

  openDialog() {
    this.showDialog = true;
  }
  closeDialog() {
    this.showDialog = false;
  }

}
