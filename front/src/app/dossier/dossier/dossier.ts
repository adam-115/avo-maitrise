import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dossier',
  imports: [],
  templateUrl: './dossier.html',
  styleUrl: './dossier.css'
})
export class Dossier {

  constructor(private readonly router: Router) {
  }

  nviagteToDossierForm() {
    this.router.navigateByUrl('/home/dossier-form');
  }

    navigateToDossierDetail() {
    this.router.navigateByUrl('/home/dossier-detail');
  }

}
