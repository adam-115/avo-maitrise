import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { UtilisateursFormDialog } from '../utilisateurs-form-dialog/utilisateurs-form-dialog';
import { UserService } from '../../../services/user.service';
import { User, UserRole } from '../../../appTypes';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-utilisateur',
  standalone: true,
  imports: [CommonModule, UtilisateursFormDialog],
  templateUrl: './utilisateur.html',
  styleUrl: './utilisateur.css'
})
export class Utilisateur implements OnInit {

  @ViewChild(UtilisateursFormDialog)
  userFormDialog !: UtilisateursFormDialog;

  userService = inject(UserService);
  users: User[] = [];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getAll().subscribe(data => {
      this.users = data;
    });
  }

  openUserFormDialg() {
    this.userFormDialog.openUserform();
  }

  editUser(user: User) {
    this.userFormDialog.openUserform(user);
  }

  deleteUser(user: User) {
    if (confirm('Voulez-vous vraiment désactiver cet utilisateur ?')) {
      // Logic to deactivate user or delete
      // For now, let's just assume we delete for the CRUD simplicity or toggle active
      // implementing delete for now
      this.userService.delete(user.id).subscribe(() => {
        this.loadUsers();
      });
    }
  }

}
