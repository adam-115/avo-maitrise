import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { Paths } from '../paths';

@Component({
  selector: 'app-home',
  imports: [RouterOutlet, FormsModule, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

  // Variable d'état pour le contrôle de la barre latérale
  isSidebarOpen: boolean = false;
  activeRoute: string = 'calendrier';
  paths = Paths;

  constructor(private readonly router: Router) {

  }

  // Cette fonction peut être appelée par le bouton d'ouverture/fermeture
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
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
