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
      // Only logout/reload if Keycloak is enabled and we actually had a token that became invalid
      if (error.status === 401 && environment.keycloak.enabled && token) {
        keycloakService.logout();
      }
      // Suppression de la déconnexion automatique sur error.status === 0
      // car un simple problème réseau ou une erreur CORS 500 provoquerait une déconnexion intempestive.
      
      return throwError(() => error);
    })
  );
};
