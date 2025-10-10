import { Component } from '@angular/core';

@Component({
  selector: 'app-utilisateurs-form-dialog',
  imports: [],
  templateUrl: './utilisateurs-form-dialog.html',
  styleUrl: './utilisateurs-form-dialog.css'
})
export class UtilisateursFormDialog {

  showDialog = false ;

  openUserform(){
    this.showDialog = true ;
  }

  closeUserForm(){
    this.showDialog = false ;
  }





}
