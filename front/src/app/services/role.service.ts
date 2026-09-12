import { Injectable, inject } from '@angular/core';
import { KeycloakService } from './keycloak.service';

/**
 * Service centralisé pour la gestion des rôles et des permissions RBAC côté frontend.
 */
@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly keycloakService = inject(KeycloakService);

  /**
   * Retourne la liste des rôles de l'utilisateur nettoyés et en majuscules (ex: ['ADMIN', 'ASSOCIE']).
   */
  get roles(): string[] {
    const rawRoles = this.keycloakService.getUserRoles() || [];
    return rawRoles.map(r => r.replace(/^ROLE_/i, '').trim().toUpperCase());
  }

  /**
   * Vérifie si l'utilisateur possède un rôle spécifique (insensible à la casse / préfixe).
   */
  hasRole(role: string): boolean {
    if (!role) return false;
    const normalized = role.replace(/^ROLE_/i, '').trim().toUpperCase();
    return this.roles.includes(normalized);
  }

  /**
   * Vérifie si l'utilisateur possède au moins un des rôles fournis.
   */
  hasAnyRole(roles: string[]): boolean {
    if (!roles || roles.length === 0) return true;
    return roles.some(role => this.hasRole(role));
  }

  /**
   * Helpers booléens pour les rôles hiérarchiques du cabinet :
   */
  get isAdmin(): boolean {
    return this.hasAnyRole(['ADMIN', 'SUPER_ADMIN']);
  }

  get isAssocie(): boolean {
    return this.isAdmin || this.hasAnyRole(['ASSOCIE', 'PARTNER']);
  }

  get isAvocat(): boolean {
    return this.isAssocie || this.hasAnyRole(['AVOCAT', 'LAWYER']);
  }

  get isCollaborateur(): boolean {
    return this.isAvocat || this.hasAnyRole(['COLLABORATEUR', 'COLLAB', 'COLLABORATOR']);
  }

  get isComplianceOfficer(): boolean {
    return this.isAdmin || this.hasAnyRole(['COMPLIANCE_OFFICER', 'COMPLIANCE']);
  }

  get isSecretariat(): boolean {
    return this.isAdmin || this.hasAnyRole(['SECRETARIAT', 'SECRETARY']);
  }

  /**
   * Droit de validation du score de risque, levée d'alerte et modification du statut AML client.
   * Réservé exclusivement à : ADMIN, SUPER_ADMIN, ASSOCIE, COMPLIANCE_OFFICER / COMPLIANCE.
   * STRICTEMENT INTERDIT aux rôles AVOCAT, COLLABORATEUR et SECRETARIAT (sauf s'ils cumulent avec Associé ou Compliance).
   */
  get canValidateRiskScoreAndAml(): boolean {
    return this.isAdmin || this.isAssocie || this.isComplianceOfficer;
  }

  /**
   * Droit d'accès au Tableau de Bord Financier global (CA, encours, rentabilité globale).
   * Réservé exclusivement aux rôles de Direction : ADMIN, SUPER_ADMIN, ASSOCIE, PARTNER.
   * STRICTEMENT INTERDIT aux rôles AVOCAT, COLLABORATEUR, SECRETARIAT.
   */
  get canAccessFinancialDashboard(): boolean {
    return this.isAdmin || this.hasAnyRole(['ASSOCIE', 'PARTNER']);
  }


  /**
   * Retourne le libellé principal du rôle pour l'affichage dans le profil utilisateur.
   */
  get primaryRoleLabel(): string {
    if (this.hasAnyRole(['SUPER_ADMIN'])) return 'Super Administrateur';
    if (this.hasAnyRole(['ADMIN'])) return 'Administrateur';
    if (this.hasAnyRole(['ASSOCIE', 'PARTNER'])) return 'Avocat Associé';
    if (this.hasAnyRole(['AVOCAT', 'LAWYER'])) return 'Avocat Titulaire';
    if (this.hasAnyRole(['COLLABORATEUR', 'COLLAB', 'COLLABORATOR'])) return 'Collaborateur';
    if (this.hasAnyRole(['COMPLIANCE_OFFICER', 'COMPLIANCE'])) return 'Compliance Officer';
    if (this.hasAnyRole(['SECRETARIAT', 'SECRETARY'])) return 'Secrétariat';
    return 'Utilisateur';
  }
}
