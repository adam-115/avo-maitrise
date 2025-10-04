import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dossier-form',
  imports: [],
  templateUrl: './dossier-form.html',
  styleUrl: './dossier-form.css'
})
export class DossierForm {

  constructor(private readonly router: Router) {

  }

  navigateToDossier() {
    this.router.navigateByUrl('/home/dossier');
  }



}
