import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KeycloakService {
  private keycloakInstance!: Keycloak;

  init(): Promise<boolean> {
    if (!environment.keycloak.enabled) {
      return Promise.resolve(true);
    }
    this.keycloakInstance = new Keycloak({
      url: environment.keycloak.url,
      realm: environment.keycloak.realm,
      clientId: environment.keycloak.clientId
    });

    return this.keycloakInstance.init({
      onLoad: 'login-required',
      checkLoginIframe: false
    });
  }

  login(): Promise<void> {
    if (!environment.keycloak.enabled) {
      return Promise.resolve();
    }
    return this.keycloakInstance.login();
  }

  logout(): Promise<void> {
    if (!environment.keycloak.enabled) {
      window.location.reload();
      return Promise.resolve();
    }
    // Redirect back to standard port 8080 or window.location.origin
    // Since the fat jar runs on port 8080, window.location.origin will point to localhost:8080 in production
    return this.keycloakInstance.logout({
      redirectUri: window.location.origin
    });
  }

  getToken(): string | undefined {
    if (!environment.keycloak.enabled) {
      return 'mock-dev-token';
    }
    return this.keycloakInstance.token;
  }

  getUsername(): string | undefined {
    if (!environment.keycloak.enabled) {
      return 'Dev User';
    }
    return this.keycloakInstance.tokenParsed?.['preferred_username'];
  }

  getUserRoles(): string[] {
    if (!environment.keycloak.enabled) {
      return ['ROLE_USER', 'ROLE_ADMIN'];
    }
    return this.keycloakInstance.realmAccess?.roles || [];
  }

  isLoggedIn(): boolean {
    if (!environment.keycloak.enabled) {
      return true;
    }
    return !!this.keycloakInstance.authenticated;
  }

  updateToken(minValidity: number = 30): Promise<boolean> {
    if (!environment.keycloak.enabled) {
      return Promise.resolve(true);
    }
    return this.keycloakInstance.updateToken(minValidity);
  }
}
