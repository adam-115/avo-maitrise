import { TempDialog } from '../temp-dialog/temp-dialog';
import { Component, ViewChild } from '@angular/core';

@Component({
  selector: 'app-temp',
  imports: [TempDialog],
  templateUrl: './temp.html',
  styleUrl: './temp.css'
})
export class Temp {
  @ViewChild(TempDialog)
  factureDialog!: TempDialog;

  openFactureDialog() {
    this.factureDialog.openModal();
  }

}
