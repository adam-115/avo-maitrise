import { NavigationService } from './../services/navigation-service';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { environment } from '../../environments/environment';
import { KeycloakService } from './../services/keycloak.service';

@Component({
  selector: 'app-home',
  imports: [RouterOutlet, FormsModule, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

  private readonly navigationService = inject(NavigationService);
  private readonly keycloakService = inject(KeycloakService);

  // Variable d'état pour le contrôle de la barre latérale
  isSidebarOpen: boolean = false;
  activeRoute: string = 'calendrier';
  paths = NavigationService;
  environment = environment;

  constructor(private readonly router: Router) {

  }

  logout() {
    this.keycloakService.logout();
  }

  // Cette fonction peut être appelée par le bouton d'ouverture/fermeture
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  navigateTODossier() {
    this.router.navigateByUrl(NavigationService.HOME + '/' + NavigationService.DOSSIER);
    this.activeRoute = NavigationService.DOSSIER;
    this.isSidebarOpen = false;
  }

  navigateTOClients() {
    this.navigationService.navigateToClients();
    this.activeRoute = NavigationService.CRM;
    this.isSidebarOpen = false;
  }

  navigateToModel() {
    this.router.navigateByUrl(NavigationService.HOME + '/' + NavigationService.MODEL);
    this.activeRoute = NavigationService.MODEL;
    this.isSidebarOpen = false;
  }

  navigateToFacturation() {
    this.router.navigateByUrl(NavigationService.HOME + '/' + NavigationService.BILLING);
    this.activeRoute = NavigationService.BILLING;
    this.isSidebarOpen = false;
  }

  navigateToCalendrier() {
    this.router.navigateByUrl(NavigationService.HOME + '/' + NavigationService.CALENDRIER);
    this.activeRoute = 'calendrier';
    this.isSidebarOpen = false;
  }

  navigateToAdministration() {
    this.router.navigateByUrl(NavigationService.HOME + '/' + NavigationService.ADMINSTRATION);
    this.activeRoute = NavigationService.ADMINSTRATION;
    this.isSidebarOpen = false;
  }

  navigateToAmlCompliance() {
    this.router.navigateByUrl(NavigationService.HOME + '/' + NavigationService.AML_COMPLIANCE);
    this.activeRoute = NavigationService.AML_COMPLIANCE;
    this.isSidebarOpen = false;
  }

  navigateToClientDiligenceStatusList() {
    this.router.navigateByUrl(NavigationService.HOME + '/' + NavigationService.CLIENT_DILIGENCE_STATUS_LIST);
    this.activeRoute = NavigationService.CLIENT_DILIGENCE_STATUS_LIST;
    this.isSidebarOpen = false;
  }

  navigateToHome() {
    this.router.navigateByUrl(NavigationService.HOME);
    this.activeRoute = 'calendrier';
    this.isSidebarOpen = false;
  }




}
