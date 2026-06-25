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
  photoData: any | null = null;
  photoPreviewUrl: string | null = null;

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
      phoneNumber: [''],
      gsm: [''],
      address: [''],
      tempPassword: ['']
    });
  }

  openUserform(user?: User) {
    this.showDialog = true;
    this.isEditMode = !!user;

    if (user) {
      this.currentUserId = user.id;
      this.photoData = user.photo || null;
      this.photoPreviewUrl = user.avatarUrl || null;
      this.userForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        isPartner: user.isPartner,
        barreauId: user.barreauId,
        phoneNumber: user.phoneNumber,
        gsm: user.gsm,
        address: user.address
      });
    } else {
      this.currentUserId = null;
      this.photoData = null;
      this.photoPreviewUrl = null;
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

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.photoData = {
        name: file.name,
        filename: file.name,
        date: new Date()
      };

      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreviewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  generatePassword() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.userForm.patchValue({ tempPassword: password });
  }

  onSubmit() {
    if (this.userForm.invalid) return;

    const formValue = this.userForm.value;
    
    // Mapping explicite pour garantir les bons types (surtout pour les booléens)
    const userData: Partial<User> = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      username: formValue.username,
      role: formValue.role,
      barreauId: formValue.barreauId,
      phoneNumber: formValue.phoneNumber,
      gsm: formValue.gsm,
      address: formValue.address,
      
      // Forcer la conversion en booléen (car les select HTML renvoient parfois des chaînes)
      isActive: formValue.isActive === true || String(formValue.isActive) === 'true',
      isPartner: formValue.isPartner === true || String(formValue.isPartner) === 'true',
      
      tempPassword: formValue.tempPassword,
      
      photo: this.photoData || undefined,
      avatarUrl: this.photoPreviewUrl || undefined,
      photoBlob: this.photoPreviewUrl || undefined
    };

    if (this.isEditMode && this.currentUserId) {
      // Ajout de l'ID qui manquait pour la mise à jour
      const userToUpdate: User = { 
        ...userData, 
        id: this.currentUserId 
      } as User;

      this.userService.update(userToUpdate).subscribe(() => {
        this.closeUserForm();
        this.userSaved.emit();
        location.reload();
      });
    } else {
      // Nouvel utilisateur
      const newUser: User = {
        ...userData,
        createdAt: new Date(),
        twoFactorEnabled: false
      } as User;

      this.userService.create(newUser).subscribe(() => {
        this.closeUserForm();
        this.userSaved.emit();
        location.reload();
      });
    }
  }
}
