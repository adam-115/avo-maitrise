import { DossierFactureDialog } from './dossier-facture-dialog/dossier-facture-dialog';
import { Component, ViewChild } from '@angular/core';

@Component({
  selector: 'app-dossier-facture',
  imports: [DossierFactureDialog],
  templateUrl: './dossier-facture.html',
  styleUrl: './dossier-facture.css'
})
export class DossierFacture {

  @ViewChild(DossierFactureDialog)
  DossierFactureDialog!: DossierFactureDialog;

  openDossierFactureDialog() {
    this.DossierFactureDialog.openDialog();
  }

  closeDossierFactureDialog() {
    this.DossierFactureDialog.closeDialog();
  }



}
