import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Paths } from '../paths';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [RouterOutlet, FormsModule,CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  activeRoute: string = 'calendrier';
  paths= Paths;

  constructor(private readonly router: Router) {

  }

  navigateTODossier() {
    this.router.navigateByUrl(Paths.HOME + '/' + Paths.DOSSIER);
    this.activeRoute = Paths.DOSSIER;
  }

  navigateTOClients() {
    this.router.navigateByUrl(Paths.HOME + '/' + Paths.CRM);
    this.activeRoute = Paths.CRM;
  }

  navigateToModel() {
    this.router.navigateByUrl(Paths.HOME + '/' + Paths.MODEL);
    this.activeRoute = Paths.MODEL;
  }

  navigateToSaisieTemps() {
    this.router.navigateByUrl(Paths.HOME + '/' + Paths.SAISIE_TEMPS);
    this.activeRoute = Paths.SAISIE_TEMPS;
  }

  navigateToFacturation() {
    this.router.navigateByUrl(Paths.HOME + '/' + Paths.FACTURATION);
    this.activeRoute = 'facturation';
  }

  navigateToCalendrier() {
    this.router.navigateByUrl(Paths.HOME + '/' + Paths.CALENDRIER);
    this.activeRoute = 'calendrier';
  }

  navigateToAdministration() {
    this.router.navigateByUrl(Paths.HOME + '/' + Paths.ADMINSTRATION);
    this.activeRoute = Paths.ADMINSTRATION;
  }


}
