import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KeycloakService {
  private keycloakInstance!: Keycloak;
  private backendRoles: string[] = [];

  async init(): Promise<boolean> {
    if (!environment.keycloak.enabled) {
      return true;
    }
    this.keycloakInstance = new Keycloak({
      url: environment.keycloak.url,
      realm: environment.keycloak.realm,
      clientId: environment.keycloak.clientId
    });

    const authenticated = await this.keycloakInstance.init({
      onLoad: 'login-required',
      checkLoginIframe: false
    });

    if (authenticated && this.keycloakInstance.token) {
      await this.loadBackendRoles();
    }
    return authenticated;
  }

  private async loadBackendRoles(): Promise<void> {
    try {
      const response = await fetch(`${environment.apiUrl}users/me/roles`, {
        headers: { Authorization: `Bearer ${this.keycloakInstance.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data?.roles)) {
          this.backendRoles = data.roles;
        }
      }
    } catch {
      // Fallback silencieux sur les rôles présents dans le JWT Keycloak
    }
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
    const roles = new Set<string>(this.backendRoles);
    (this.keycloakInstance?.realmAccess?.roles || []).forEach(r => roles.add(r));
    const resourceAccess = this.keycloakInstance?.resourceAccess || {};
    Object.values(resourceAccess).forEach((entry: any) => {
      if (Array.isArray(entry?.roles)) {
        entry.roles.forEach((r: string) => roles.add(r));
      }
    });
    return Array.from(roles);
  }

  hasAnyRole(allowedRoles: string[]): boolean {
    const normalizedUserRoles = this.getUserRoles().map(r => r.replace(/^ROLE_/i, '').toUpperCase());
    return allowedRoles.some(role => normalizedUserRoles.includes(role.replace(/^ROLE_/i, '').toUpperCase()));
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
