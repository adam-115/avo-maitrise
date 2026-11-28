import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User, UserRole } from '../../../appTypes';
import { UserService } from '../../../services/user.service';
import { AlertService } from '../../../services/alert-service';

interface RoleOption {
  value: UserRole;
  label: string;
  desc: string;
}

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
  currentKeycloakId: string | null = null;
  saving = false;
  submitAttempted = false;
  copiedPassword = false;

  readonly roleOptions: RoleOption[] = [
    { value: UserRole.ADMIN, label: 'Administrateur', desc: 'Accès complet & gestion utilisateurs' },
    { value: UserRole.ASSOCIE, label: 'Associé', desc: 'Supervision dossiers & validations' },
    { value: UserRole.AVOCAT, label: 'Avocat', desc: 'Gestion dossiers, clients & suppressions' },
    { value: UserRole.COLLABORATEUR, label: 'Collaborateur', desc: 'Travail sur les dossiers assignés' },
    { value: UserRole.SECRETARIAT, label: 'Secrétariat', desc: 'Accueil, clients & documents' },
    { value: UserRole.COMPLIANCE_OFFICER, label: 'Conformité (AML)', desc: 'Vigilance LCB-FT & alertes KYC' }
  ];

  private readonly fieldLabels: Record<string, string> = {
    firstName: 'Prénom',
    lastName: 'Nom',
    username: 'Nom d\'utilisateur (min. 3 caractères)',
    email: 'Adresse email valide',
    role: 'Rôle'
  };

  photoData: any | null = null;
  photoPreviewUrl: string | null = null;

  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private alertService = inject(AlertService);

  constructor() {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(60)]],
      lastName: ['', [Validators.required, Validators.maxLength(60)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      role: [UserRole.AVOCAT, Validators.required],
      isActive: [true],
      isPartner: [false],
      barreauId: ['', Validators.maxLength(50)],
      phoneNumber: ['', Validators.maxLength(30)],
      gsm: ['', Validators.maxLength(30)],
      address: ['', Validators.maxLength(255)],
      tempPassword: ['']
    });
  }

  get initials(): string {
    const f = (this.userForm.get('firstName')?.value || '').trim().charAt(0).toUpperCase();
    const l = (this.userForm.get('lastName')?.value || '').trim().charAt(0).toUpperCase();
    return (f + l) || 'U';
  }

  get invalidFieldsSummary(): string[] {
    if (!this.submitAttempted) return [];
    const missing: string[] = [];
    Object.keys(this.fieldLabels).forEach(key => {
      const ctrl = this.userForm.get(key);
      if (ctrl && ctrl.invalid) {
        missing.push(this.fieldLabels[key]);
      }
    });
    return missing;
  }

  isFieldInvalid(fieldName: string): boolean {
    const ctrl = this.userForm.get(fieldName);
    return !!(ctrl && ctrl.invalid && (ctrl.touched || this.submitAttempted));
  }

  openUserform(user?: User) {
    this.showDialog = true;
    this.isEditMode = !!user;
    this.saving = false;
    this.submitAttempted = false;
    this.copiedPassword = false;

    if (user) {
      this.currentUserId = user.id;
      this.currentKeycloakId = user.keycloakId || null;
      this.photoData = user.photo || null;
      this.photoPreviewUrl = user.avatarUrl || user.photoBlob || null;
      this.userForm.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        username: user.username || '',
        role: user.role || UserRole.AVOCAT,
        isActive: user.isActive !== false,
        isPartner: !!user.isPartner,
        barreauId: user.barreauId || '',
        phoneNumber: user.phoneNumber || '',
        gsm: user.gsm || '',
        address: user.address || '',
        tempPassword: ''
      });
    } else {
      this.currentUserId = null;
      this.currentKeycloakId = null;
      this.photoData = null;
      this.photoPreviewUrl = null;
      this.userForm.reset({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        role: UserRole.AVOCAT,
        isActive: true,
        isPartner: false,
        barreauId: '',
        phoneNumber: '',
        gsm: '',
        address: '',
        tempPassword: ''
      });
    }
  }

  closeUserForm() {
    if (this.saving) return;
    this.showDialog = false;
  }

  selectRole(role: UserRole) {
    this.userForm.patchValue({ role });
  }

  onFileSelected(event: any): void {
    const file = event.target?.files?.[0];
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

  removePhoto(): void {
    this.photoData = null;
    this.photoPreviewUrl = null;
  }

  generatePassword() {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const special = '!@#$%^&*';
    const all = lower + upper + digits + special;
    let pwd = lower[Math.floor(Math.random() * lower.length)]
      + upper[Math.floor(Math.random() * upper.length)]
      + digits[Math.floor(Math.random() * digits.length)]
      + special[Math.floor(Math.random() * special.length)];
    for (let i = 4; i < 14; i++) {
      pwd += all.charAt(Math.floor(Math.random() * all.length));
    }
    this.userForm.patchValue({ tempPassword: pwd });
    this.copiedPassword = false;
  }

  copyPassword() {
    const pwd = this.userForm.get('tempPassword')?.value;
    if (pwd && navigator.clipboard) {
      navigator.clipboard.writeText(pwd).then(() => {
        this.copiedPassword = true;
        setTimeout(() => (this.copiedPassword = false), 2000);
      });
    }
  }

  onSubmit() {
    this.submitAttempted = true;
    this.userForm.markAllAsTouched();
    if (this.userForm.invalid || this.saving) return;

    this.saving = true;
    const formValue = this.userForm.value;

    const userData: Partial<User> = {
      firstName: formValue.firstName?.trim(),
      lastName: formValue.lastName?.trim(),
      email: formValue.email?.trim(),
      username: formValue.username?.trim(),
      role: formValue.role,
      barreauId: formValue.barreauId?.trim() || '',
      phoneNumber: formValue.phoneNumber?.trim() || '',
      gsm: formValue.gsm?.trim() || '',
      address: formValue.address?.trim() || '',
      isActive: formValue.isActive === true || String(formValue.isActive) === 'true',
      isPartner: formValue.isPartner === true || String(formValue.isPartner) === 'true',
      tempPassword: formValue.tempPassword || undefined,
      photo: this.photoData || undefined,
      avatarUrl: this.photoPreviewUrl || undefined,
      photoBlob: this.photoPreviewUrl || undefined
    };

    if (this.isEditMode && this.currentUserId) {
      const userToUpdate: User = {
        ...userData,
        id: this.currentUserId,
        keycloakId: this.currentKeycloakId || undefined
      } as User;

      this.userService.update(userToUpdate).subscribe({
        next: () => {
          this.saving = false;
          this.showDialog = false;
          this.alertService.success('Utilisateur mis à jour et synchronisé avec Keycloak');
          this.userSaved.emit();
        },
        error: (err) => {
          this.saving = false;
          const msg = err?.error?.message || err?.message || 'Impossible de mettre à jour l\'utilisateur.';
          this.alertService.displayMessage('Erreur de mise à jour', msg, 'error');
        }
      });
    } else {
      const newUser: User = {
        ...userData,
        createdAt: new Date(),
        twoFactorEnabled: false
      } as User;

      this.userService.create(newUser).subscribe({
        next: () => {
          this.saving = false;
          this.showDialog = false;
          this.alertService.success('Utilisateur créé et synchronisé avec Keycloak');
          this.userSaved.emit();
        },
        error: (err) => {
          this.saving = false;
          const msg = err?.error?.message || err?.message || 'Impossible de créer l\'utilisateur dans Keycloak.';
          this.alertService.displayMessage('Erreur de création', msg, 'error');
        }
      });
    }
  }
}
