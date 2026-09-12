import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { KeycloakService } from './keycloak.service';
import { catchError, switchMap } from 'rxjs/operators';
import { from, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const keycloakService = inject(KeycloakService);

  if (!environment.keycloak.enabled) {
    return next(req);
  }

  return from(keycloakService.getValidToken()).pipe(
    switchMap(token => {
      let authReq = req;
      if (token) {
        authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      return next(authReq);
    }),
    catchError((error: HttpErrorResponse) => {
      // Si 401 Unauthorized : tenter un rafraîchissement forcé et rejouer la requête avant de déconnecter
      if (error.status === 401 && environment.keycloak.enabled && !req.headers.has('X-Retry-Auth')) {
        console.warn('[Auth Interceptor] 401 reçu, tentative de renouvellement de session...');
        return from(keycloakService.updateToken(-1)).pipe(
          switchMap(refreshed => {
            const freshToken = keycloakService.getToken();
            if (freshToken && keycloakService.isLoggedIn()) {
              console.log('[Auth Interceptor] Jeton renouvelé avec succès, réessai de la requête...');
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${freshToken}`,
                  'X-Retry-Auth': 'true'
                }
              });
              return next(retryReq);
            } else {
              console.error('[Auth Interceptor] Session SSO expirée ou révoquée sur Keycloak.');
              keycloakService.logout();
              return throwError(() => error);
            }
          }),
          catchError(refreshErr => {
            console.error('[Auth Interceptor] Échec critique du rafraîchissement token:', refreshErr);
            keycloakService.logout();
            return throwError(() => error);
          })
        );
      } else if (error.status === 401 && req.headers.has('X-Retry-Auth')) {
        // Déjà réessayé et toujours 401 -> Session définitivement expirée
        console.error('[Auth Interceptor] Session expirée définitivement après nouvel essai.');
        keycloakService.logout();
      } else if (error.status === 403) {
        console.warn(`[RBAC Interceptor] Requête non autorisée (403 Forbidden) : ${req.method} ${req.url}`);
      }
      return throwError(() => error);
    })
  );
};


