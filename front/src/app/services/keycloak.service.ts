import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KeycloakService {
  private keycloakInstance!: Keycloak;
  private refreshPromise: Promise<boolean> | null = null;

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
      checkLoginIframe: false,
      enableLogging: false,
      pkceMethod: 'S256'
    }).then(authenticated => {
      if (authenticated) {
        this.setupAutoRefresh();
      }
      return authenticated;
    }).catch(err => {
      console.error('[KeycloakService] Échec de l\'initialisation Keycloak:', err);
      return false;
    });
  }

  private setupAutoRefresh(): void {
    // 1. Événement natif Keycloak lors de l'expiration
    this.keycloakInstance.onTokenExpired = () => {
      console.log('[KeycloakService] Jeton expiré ou proche de l\'expiration, renouvellement silencieux...');
      this.updateToken(90).catch(err => {
        console.warn('[KeycloakService] Échec du renouvellement sur expiration:', err);
      });
    };

    this.keycloakInstance.onAuthRefreshSuccess = () => {
      console.log('[KeycloakService] Session SSO active, jeton renouvelé avec succès.');
    };

    this.keycloakInstance.onAuthRefreshError = () => {
      console.warn('[KeycloakService] Échec du rafraîchissement silencieux de session.');
    };

    // 2. Heartbeat périodique toutes les 60 secondes pour maintenir le token et la session SSO actifs
    setInterval(() => {
      if (this.keycloakInstance?.authenticated) {
        // Rafraîchir si le token expire dans moins de 3 minutes (180s)
        try {
          if (this.keycloakInstance.isTokenExpired(180)) {
            this.updateToken(180).catch(() => {});
          }
        } catch {
          this.updateToken(180).catch(() => {});
        }
      }
    }, 60000);

    // 3. Réactivation instantanée lors du retour sur l'onglet / la fenêtre
    if (typeof window !== 'undefined') {
      const onUserActive = () => {
        if (this.keycloakInstance?.authenticated) {
          try {
            if (this.keycloakInstance.isTokenExpired(180)) {
              this.updateToken(180).catch(() => {});
            }
          } catch {
            this.updateToken(180).catch(() => {});
          }
        }
      };

      window.addEventListener('focus', onUserActive);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          onUserActive();
        }
      });
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
    return this.keycloakInstance.logout({
      redirectUri: window.location.origin
    });
  }

  getToken(): string | undefined {
    if (!environment.keycloak.enabled) {
      return 'mock-dev-token';
    }
    return this.keycloakInstance?.token;
  }

  async getValidToken(): Promise<string | undefined> {
    if (!environment.keycloak.enabled) {
      return 'mock-dev-token';
    }
    if (!this.keycloakInstance || !this.keycloakInstance.authenticated) {
      return undefined;
    }
    try {
      // Si le jeton expire dans moins de 90 secondes, le renouveler (dédupliqué via Mutex)
      if (this.keycloakInstance.isTokenExpired(90)) {
        await this.updateToken(90);
      }
      return this.keycloakInstance.token;
    } catch (error) {
      console.warn('[KeycloakService] Impossible de renouveler le token:', error);
      return this.keycloakInstance.token;
    }
  }

  getUsername(): string | undefined {
    if (!environment.keycloak.enabled) {
      return 'Dev User';
    }
    return this.keycloakInstance?.tokenParsed?.['preferred_username'];
  }

  getUserRoles(): string[] {
    if (!environment.keycloak.enabled) {
      return ['ROLE_USER', 'ROLE_ADMIN'];
    }
    return this.keycloakInstance?.realmAccess?.roles || [];
  }

  isLoggedIn(): boolean {
    if (!environment.keycloak.enabled) {
      return true;
    }
    return !!this.keycloakInstance?.authenticated;
  }

  /**
   * Rafraîchit le jeton avec protection Mutex anti-concurrence (déduplication d'appels simultanés).
   */
  updateToken(minValidity: number = 60): Promise<boolean> {
    if (!environment.keycloak.enabled || !this.keycloakInstance?.authenticated) {
      return Promise.resolve(false);
    }

    // Si une demande de rafraîchissement est déjà en cours, réutiliser la promesse existante
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.keycloakInstance
      .updateToken(minValidity)
      .then(refreshed => {
        return refreshed;
      })
      .catch(err => {
        console.warn('[KeycloakService] Échec rafraîchissement token:', err);
        return false;
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }
}
