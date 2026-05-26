import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KeycloakService {
  private keycloakInstance!: Keycloak;

  init(): Promise<boolean> {
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
    return this.keycloakInstance.login();
  }

  logout(): Promise<void> {
    // Redirect back to standard port 8080 or window.location.origin
    // Since the fat jar runs on port 8080, window.location.origin will point to localhost:8080 in production
    return this.keycloakInstance.logout({
      redirectUri: window.location.origin
    });
  }

  getToken(): string | undefined {
    return this.keycloakInstance.token;
  }

  getUsername(): string | undefined {
    return this.keycloakInstance.tokenParsed?.['preferred_username'];
  }

  getUserRoles(): string[] {
    return this.keycloakInstance.realmAccess?.roles || [];
  }

  isLoggedIn(): boolean {
    return !!this.keycloakInstance.authenticated;
  }

  updateToken(minValidity: number = 30): Promise<boolean> {
    return this.keycloakInstance.updateToken(minValidity);
  }
}
