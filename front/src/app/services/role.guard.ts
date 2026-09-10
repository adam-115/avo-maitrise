import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoleService } from './role.service';

/**
 * Garde de routage Angular (CanActivateFn) pour la protection des pages sensibles par rôles RBAC.
 * Utilisation dans app.routes.ts :
 * {
 *   path: NavigationService.UTILISATEURS,
 *   loadComponent: () => import(...),
 *   canActivate: [roleGuard],
 *   data: { roles: ['ADMIN', 'SUPER_ADMIN'] }
 * }
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const roleService = inject(RoleService);
  const router = inject(Router);

  const expectedRoles: string[] = route.data?.['roles'] || [];

  // Si aucune contrainte de rôle n'est spécifiée ou si l'utilisateur possède l'un des rôles requis
  if (expectedRoles.length === 0 || roleService.hasAnyRole(expectedRoles)) {
    return true;
  }

  // Redirection silencieuse vers l'accueil sans erreur console
  console.warn(`[RBAC] Accès refusé pour la route '${state.url}'. Rôles requis: ${expectedRoles.join(', ')}`);
  router.navigate(['/home']);
  return false;
};
