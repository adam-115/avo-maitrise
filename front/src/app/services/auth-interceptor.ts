import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { KeycloakService } from './keycloak.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const keycloakService = inject(KeycloakService);
  const token = keycloakService.getToken();

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Déconnexion uniquement sur 401 si session Keycloak expirée
      if (error.status === 401 && environment.keycloak.enabled && token) {
        keycloakService.logout();
      } else if (error.status === 403) {
        console.warn(`[RBAC Interceptor] Requête non autorisée (403 Forbidden) : ${req.method} ${req.url}`);
      }
      
      return throwError(() => error);
    })
  );
};

