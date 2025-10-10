import { Component, ViewChild } from '@angular/core';
import { UtilisateursFormDialog } from '../utilisateurs-form-dialog/utilisateurs-form-dialog';

@Component({
  selector: 'app-utilisateur',
  imports: [UtilisateursFormDialog],
  templateUrl: './utilisateur.html',
  styleUrl: './utilisateur.css'
})
export class Utilisateur {

  @ViewChild(UtilisateursFormDialog)
  userFormDialog !: UtilisateursFormDialog;


  openUserFormDialg(){
    this.userFormDialog.openUserform()
  }

}
