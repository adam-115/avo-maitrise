import { NavigationService } from './../services/navigation-service';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { environment } from '../../environments/environment';

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
  environment = environment;

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
    this.navigationService.navigateToClients();
    this.activeRoute = NavigationService.CRM;
  }

  navigateToModel() {
    this.router.navigateByUrl(NavigationService.HOME + '/' + NavigationService.MODEL);
    this.activeRoute = NavigationService.MODEL;
  }

  navigateToFacturation() {
    this.router.navigateByUrl(NavigationService.HOME + '/' + NavigationService.BILLING);
    this.activeRoute = NavigationService.BILLING;
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
