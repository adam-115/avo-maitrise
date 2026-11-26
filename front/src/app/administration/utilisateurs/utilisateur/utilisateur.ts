import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UtilisateursFormDialog } from '../utilisateurs-form-dialog/utilisateurs-form-dialog';
import { UserService } from '../../../services/user.service';
import { AlertService } from '../../../services/alert-service';
import { User } from '../../../appTypes';
import { PaginatedResponse } from '../../../services/genericService/abstract-crud.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-utilisateur',
  standalone: true,
  imports: [CommonModule, FormsModule, UtilisateursFormDialog, TranslatePipe],
  templateUrl: './utilisateur.html',
  styleUrl: './utilisateur.css'
})
export class Utilisateur implements OnInit {

  @ViewChild(UtilisateursFormDialog)
  userFormDialog !: UtilisateursFormDialog;

  userService = inject(UserService);
  alertService = inject(AlertService);
  
  users: User[] = [];
  filteredUsers: User[] = [];

  searchTerm: string = '';
  selectedRole: string = '';
  viewMode: 'table' | 'grid' = 'table';

  get activeUsersCount(): number {
    return this.users.filter(u => u.isActive !== false).length;
  }

  get adminCount(): number {
    return this.users.filter(u => (u.role || '').toUpperCase() === 'ADMIN').length;
  }

  get lawyerCount(): number {
    return this.users.filter(u => (u.role || '').toUpperCase() === 'AVOCAT').length;
  }

  get staffCount(): number {
    return this.users.filter(u => {
      const r = (u.role || '').toUpperCase();
      return r === 'COLLABORATEUR' || r === 'SECRETARIAT' || r === 'CONSULTANT' || r === 'STANDARD';
    }).length;
  }

  get isFiltered(): boolean {
    return !!(this.searchTerm.trim() || this.selectedRole);
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getAll().subscribe({
      next: (data: PaginatedResponse<User>) => {
        this.users = data.content || [];
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error loading users', err);
      }
    });
  }

  applyFilters(): void {
    let list = [...this.users];

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(u => 
        (u.firstName || '').toLowerCase().includes(q) ||
        (u.lastName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q)
      );
    }

    if (this.selectedRole) {
      list = list.filter(u => (u.role || '').toLowerCase() === this.selectedRole.toLowerCase());
    }

    this.filteredUsers = list;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedRole = '';
    this.applyFilters();
  }

  getUserInitials(user: User): string {
    const f = (user.firstName || '').charAt(0).toUpperCase();
    const l = (user.lastName || '').charAt(0).toUpperCase();
    return (f + l) || 'US';
  }

  getRoleBadgeClass(role: string | undefined): string {
    const r = (role || '').toUpperCase();
    switch (r) {
      case 'ADMIN':
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/10';
      case 'AVOCAT':
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/10';
      case 'COLLABORATEUR':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/10';
      case 'SECRETARIAT':
      case 'STANDARD':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/10';
      case 'CONSULTANT':
        return 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-500/10';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 ring-1 ring-slate-500/10';
    }
  }

  openUserFormDialg() {
    this.userFormDialog.openUserform();
  }

  editUser(user: User) {
    this.userFormDialog.openUserform(user);
  }

  async disableUser(user: User) {
    const confirmed = await this.alertService.confirmMessage(
      'Désactiver l\'utilisateur',
      `Voulez-vous vraiment désactiver l'utilisateur ${user.firstName} ${user.lastName} ?`,
      'warning'
    );

    if (confirmed && user.id) {
      this.userService.disableUser(user.id).subscribe({
        next: () => {
          this.alertService.success('Utilisateur désactivé avec succès');
          this.loadUsers();
        },
        error: () => {
          this.alertService.displayMessage('Erreur', 'Impossible de désactiver l\'utilisateur', 'error');
        }
      });
    }
  }

  async resetPassword(user: User) {
    const confirmed = await this.alertService.confirmMessage(
      'Réinitialiser le mot de passe',
      `Voulez-vous réinitialiser le mot de passe de ${user.firstName} ${user.lastName} ?`,
      'question'
    );

    if (confirmed && user.id) {
      this.userService.resetPassword(user.id).subscribe({
        next: () => {
          this.alertService.displayMessage(
            'Succès',
            `Nouveau mot de passe temporaire généré`,
            'success'
          );
        },
        error: () => {
          this.alertService.displayMessage('Erreur', 'Impossible de réinitialiser le mot de passe', 'error');
        }
      });
    }
  }

  async reconfigureOtp(user: User) {
    const confirmed = await this.alertService.confirmMessage(
      'Reconfigurer OTP',
      `Forcer ${user.firstName} ${user.lastName} à reconfigurer son Authentification à Double Facteur (2FA) ?`,
      'question'
    );

    if (confirmed && user.id) {
      this.userService.reconfigureOtp(user.id).subscribe({
        next: () => {
          this.alertService.success('Action requise ajoutée dans Keycloak');
        },
        error: () => {
          this.alertService.displayMessage('Erreur', 'Impossible de forcer la reconfiguration OTP', 'error');
        }
      });
    }
  }

}
