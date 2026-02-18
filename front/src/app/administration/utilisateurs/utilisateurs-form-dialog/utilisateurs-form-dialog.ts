import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User, UserRole } from '../../../appTypes';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-utilisateurs-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './utilisateurs-form-dialog.html',
  styleUrl: './utilisateurs-form-dialog.css'
})
export class UtilisateursFormDialog {

  @Output() userSaved = new EventEmitter<void>();

  showDialog = false;
  userForm: FormGroup;
  isEditMode = false;
  currentUserId: string | number | null = null;

  userRoles = Object.values(UserRole);

  private fb = inject(FormBuilder);
  private userService = inject(UserService);

  constructor() {
    this.userForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
      role: [UserRole.COLLABORATEUR, Validators.required],
      isActive: [true],
      isPartner: [false],
      barreauId: [''],
      // Password handling would typically be more complex (separate change password flow)
      // For now, we omit it or treat it as optional/separate
    });
  }

  openUserform(user?: User) {
    this.showDialog = true;
    this.isEditMode = !!user;

    if (user) {
      this.currentUserId = user.id;
      this.userForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        isPartner: user.isPartner,
        barreauId: user.barreauId
      });
    } else {
      this.currentUserId = null;
      this.userForm.reset({
        role: UserRole.COLLABORATEUR,
        isActive: true,
        isPartner: false
      });
    }
  }

  closeUserForm() {
    this.showDialog = false;
  }

  onSubmit() {
    if (this.userForm.invalid) return;

    const formValue = this.userForm.value;
    const userData: Partial<User> = {
      ...formValue
    };

    if (this.isEditMode && this.currentUserId) {
      this.userService.update(this.currentUserId, userData as User).subscribe(() => {
        this.closeUserForm();
        this.userSaved.emit();
        // Reload parent or notify
        location.reload(); // Simple reload for now or emit event to parent
      });
    } else {
      // New user
      const newUser: any = {
        ...userData,
        createdAt: new Date(),
        twoFactorEnabled: false // default
      };
      this.userService.create(newUser).subscribe(() => {
        this.closeUserForm();
        this.userSaved.emit();
        location.reload();
      });
    }
  }
}
