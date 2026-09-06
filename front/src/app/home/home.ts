import { NavigationService } from './../services/navigation-service';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { environment } from '../../environments/environment';
import { KeycloakService } from './../services/keycloak.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterOutlet, FormsModule, CommonModule, TranslatePipe],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit, OnDestroy {

  private readonly navigationService = inject(NavigationService);
  private readonly keycloakService = inject(KeycloakService);
  public readonly translate = inject(TranslateService);
  public readonly router = inject(Router);

  // Variable d'état pour le contrôle de la barre latérale
  isSidebarOpen: boolean = false;
  activeRoute: string = 'home';
  paths = NavigationService;
  environment = environment;
  currentLang: string = 'fr';
  private routerSubscription?: Subscription;

  constructor() {
    this.translate.addLangs(['fr', 'en', 'es', 'de', 'it', 'ar']);
    this.translate.setFallbackLang('fr');
    this.translate.use('fr');
    document.documentElement.dir = 'ltr';
  }

  ngOnInit(): void {
    // Synchroniser activeRoute dès le chargement initial
    this.updateActiveRouteFromUrl(this.router.url);

    // Écouter les changements d'URL
    this.routerSubscription = this.router.events.pipe(
      filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateActiveRouteFromUrl(event.urlAfterRedirects || event.url);
    });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private updateActiveRouteFromUrl(url: string): void {
    if (url.includes('/home/' + NavigationService.AML_COMPLIANCE)) {
      this.activeRoute = NavigationService.AML_COMPLIANCE;
    } else if (url.includes('/home/' + NavigationService.CLIENT_DILIGENCE_STATUS_LIST) || url.includes('/home/' + NavigationService.DILIGENCE_FORM_LIST)) {
      this.activeRoute = NavigationService.CLIENT_DILIGENCE_STATUS_LIST;
    } else if (url.includes('/home/' + NavigationService.CALENDRIER)) {
      this.activeRoute = NavigationService.CALENDRIER;
    } else if (url.includes('/home/' + NavigationService.DOSSIER)) {
      this.activeRoute = NavigationService.DOSSIER;
    } else if (url.includes('/home/' + NavigationService.CRM) || url.includes('/home/' + NavigationService.CLIENT_DETAILS) || url.includes('/home/' + NavigationService.NEW_CLIENT)) {
      this.activeRoute = NavigationService.CRM;
    } else if (url.includes('/home/' + NavigationService.MODEL)) {
      this.activeRoute = NavigationService.MODEL;
    } else if (url.includes('/home/' + NavigationService.BILLING_DASHBOARD)) {
      this.activeRoute = NavigationService.BILLING_DASHBOARD;
    } else if (url.includes('/home/' + NavigationService.BILLING)) {
      this.activeRoute = NavigationService.BILLING;
    } else if (url.includes('/home/' + NavigationService.ADMINSTRATION) || url.includes('/home/' + NavigationService.ADMIN_PREFERENCE)) {
      this.activeRoute = NavigationService.ADMINSTRATION;
    } else if (url === '/home' || url === '/home/') {
      this.activeRoute = 'home';
    }
  }

  get username(): string {
    return this.keycloakService.getUsername() || 'Avocat';
  }

  get userInitials(): string {
    const name = this.username.trim();
    if (!name) return 'AV';
    const parts = name.split(/[ ._-]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  changeLanguage(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.currentLang = selectElement.value;
    this.translate.use(this.currentLang);
    if (this.currentLang === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }

  logout() {
    this.keycloakService.logout();
  }

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

  navigateToBillingDashboard() {
    this.router.navigateByUrl(NavigationService.HOME + '/' + NavigationService.BILLING_DASHBOARD);
    this.activeRoute = NavigationService.BILLING_DASHBOARD;
    this.isSidebarOpen = false;
  }

  navigateToCalendrier() {
    this.router.navigateByUrl(NavigationService.HOME + '/' + NavigationService.CALENDRIER);
    this.activeRoute = NavigationService.CALENDRIER;
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
    this.activeRoute = 'home';
    this.isSidebarOpen = false;
  }
}

