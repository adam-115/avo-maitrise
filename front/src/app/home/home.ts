import { NavigationService } from './../services/navigation-service';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterOutlet, FormsModule, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

  private readonly navigationService = inject(NavigationService);

  // Variable d'état pour le contrôle de la barre latérale
  isSidebarOpen: boolean = false;
  activeRoute: string = 'calendrier';
  paths = NavigationService;

  constructor(private readonly router: Router) {

  }

  // Cette fonction peut être appelée par le bouton d'ouverture/fermeture
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  navigateTODossier() {
    this.router.navigateByUrl(NavigationService.HOME + '/' + NavigationService.DOSSIER);
    this.activeRoute = NavigationService.DOSSIER;
  }

  navigateTOClients() {
    this.navigationService.navigateTOClients();
    this.activeRoute = NavigationService.CRM;
  }

  navigateToModel() {
    this.router.navigateByUrl(NavigationService.HOME + '/' + NavigationService.MODEL);
    this.activeRoute = NavigationService.MODEL;
  }

  navigateToSaisieTemps() {
    this.router.navigateByUrl(NavigationService.HOME + '/' + NavigationService.SAISIE_TEMPS);
    this.activeRoute = NavigationService.SAISIE_TEMPS;
  }

  navigateToFacturation() {
    this.router.navigateByUrl(NavigationService.HOME + '/' + NavigationService.FACTURATION);
    this.activeRoute = 'facturation';
  }

  navigateToCalendrier() {
    this.router.navigateByUrl(NavigationService.HOME + '/' + NavigationService.CALENDRIER);
    this.activeRoute = 'calendrier';
  }

  navigateToAdministration() {
    this.router.navigateByUrl(NavigationService.HOME + '/' + NavigationService.ADMINSTRATION);
    this.activeRoute = NavigationService.ADMINSTRATION;
  }




}
