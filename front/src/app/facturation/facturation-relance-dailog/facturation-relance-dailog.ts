import { Component } from '@angular/core';

@Component({
  selector: 'app-facturation-relance-dailog',
  imports: [],
  templateUrl: './facturation-relance-dailog.html',
  styleUrl: './facturation-relance-dailog.css'
})
export class FacturationRelanceDailog {

  showDialog: boolean = false;

  constructor() { }
  openDialog() {
    this.showDialog = true;
  }

  closeDialog() {
    this.showDialog = false;
  }



}
