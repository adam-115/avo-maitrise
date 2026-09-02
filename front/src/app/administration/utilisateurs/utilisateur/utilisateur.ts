import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { UtilisateursFormDialog } from '../utilisateurs-form-dialog/utilisateurs-form-dialog';
import { UserService } from '../../../services/user.service';
import { AlertService } from '../../../services/alert-service';
import { User, UserRole } from '../../../appTypes';
import { CommonModule } from '@angular/common';
import { PaginatedResponse } from '../../../services/genericService/abstract-crud.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-utilisateur',
  standalone: true,
  imports: [CommonModule, UtilisateursFormDialog, TranslatePipe],
  templateUrl: './utilisateur.html',
  styleUrl: './utilisateur.css'
})
export class Utilisateur implements OnInit {

  @ViewChild(UtilisateursFormDialog)
  userFormDialog !: UtilisateursFormDialog;

  userService = inject(UserService);
  alertService = inject(AlertService);
  users: User[] = [];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getAll().subscribe((data: PaginatedResponse<User>) => {
      this.users = data.content;
    });
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
        next: (newPassword) => {
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
