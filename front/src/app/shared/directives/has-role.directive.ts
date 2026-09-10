import { Directive, Input, TemplateRef, ViewContainerRef, inject, OnInit } from '@angular/core';
import { RoleService } from '../../services/role.service';

/**
 * Directive structurelle *hasRole pour masquer/afficher des éléments du DOM
 * (boutons d'action, onglets, formulaires) selon les rôles de l'utilisateur connecté.
 *
 * Exemples :
 * <button *hasRole="['ADMIN', 'SUPER_ADMIN']" (click)="deleteUser()">Supprimer</button>
 * <div *hasRole="'ASSOCIE'">Section Associé</div>
 */
@Directive({
  selector: '[hasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit {
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly roleService = inject(RoleService);

  private allowedRoles: string[] = [];
  private isVisible = false;

  @Input('hasRole') set hasRole(roles: string | string[]) {
    if (typeof roles === 'string') {
      this.allowedRoles = [roles];
    } else if (Array.isArray(roles)) {
      this.allowedRoles = roles;
    } else {
      this.allowedRoles = [];
    }
    this.updateView();
  }

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    const hasPermission = this.allowedRoles.length === 0 || this.roleService.hasAnyRole(this.allowedRoles);

    if (hasPermission && !this.isVisible) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isVisible = true;
    } else if (!hasPermission && this.isVisible) {
      this.viewContainer.clear();
      this.isVisible = false;
    }
  }
}
