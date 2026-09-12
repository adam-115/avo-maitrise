import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User, UserRole, UserRoleDefinition } from '../../../appTypes';
import { UserService } from '../../../services/user.service';
import { AlertService } from '../../../services/alert-service';

export interface RolePreset {
  name: string;
  roles: UserRole[];
  isPartner: boolean;
  icon: string;
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
  activeTab: 'identity' | 'contact' | 'roles' | 'security' = 'identity';

  selectedRoles: string[] = [UserRole.COLLABORATEUR];
  photoData: any | null = null;
  photoPreviewUrl: string | null = null;
  passwordCopied = false;
  isSubmitting = false;

  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private alertService = inject(AlertService);

  readonly availableRoles: UserRoleDefinition[] = [
    {
      id: UserRole.ASSOCIE,
      label: 'Avocat Associé (Partner)',
      category: 'DIRECTION',
      description: 'Direction : accès intégral à tous les dossiers, CA global consolidé, validation financière et conformité.',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-500/20',
      borderClass: 'border-amber-300 bg-amber-50/30',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      permissions: ['Accès intégral dossiers', 'CA global cabinet', 'Validation factures', 'Validation AML/KYC']
    },
    {
      id: UserRole.AVOCAT,
      label: 'Avocat (Titulaire)',
      category: 'JURIDIQUE',
      description: 'Opérationnel : gestion exclusive de ses dossiers et dossiers assignés, CA personnel, pièces et actes.',
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-300 ring-1 ring-blue-500/20',
      borderClass: 'border-blue-300 bg-blue-50/30',
      icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
      permissions: ['Dossiers assignés', 'Pièces & Actes', 'CA personnel', 'Screening AML']
    },
    {
      id: UserRole.COLLABORATEUR,
      label: 'Collaborateur (Collab.)',
      category: 'JURIDIQUE',
      description: 'Production : travail sur dossiers assignés, saisie des temps et actes, préparation des projets.',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-500/20',
      borderClass: 'border-emerald-300 bg-emerald-50/30',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      permissions: ['Dossiers assignés', 'Saisie des temps', 'Tâches & Actes', 'Screening AML']
    },
    {
      id: UserRole.COMPLIANCE_OFFICER,
      label: 'Responsable Conformité (Compliance)',
      category: 'DIRECTION',
      description: 'Conformité : screening sanctions/PPE, scoring risque et levée d\'alertes, rapport Bâtonnier et audit KYC.',
      badgeClass: 'bg-purple-50 text-purple-800 border-purple-300 ring-1 ring-purple-500/20',
      borderClass: 'border-purple-300 bg-purple-50/30',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      permissions: ['Screening Sanctions/PPE', 'Validation alertes & scores', 'Rapport Bâtonnier (PDF)', 'Audit AML']
    },
    {
      id: UserRole.SECRETARIAT,
      label: 'Secrétariat Juridique (Secrétariat)',
      category: 'SUPPORT',
      description: 'Support : accueil, création préliminaire de dossiers, pièces administratives, planning d\'audiences et émission factures.',
      badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-300 ring-1 ring-cyan-500/20',
      borderClass: 'border-cyan-300 bg-cyan-50/30',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      permissions: ['Création dossiers', 'Pièces administratives', 'Planning audiences', 'Émission factures']
    },
    {
      id: UserRole.ADMIN,
      label: 'Administrateur Système (Admin)',
      category: 'TECHNIQUE',
      description: 'Gestion des comptes, réinitialisation MDP & 2FA, supervision technique, sécurité et logs d\'erreurs BDD.',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-500/20',
      borderClass: 'border-rose-300 bg-rose-50/30',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      permissions: ['Gestion utilisateurs', 'Reset MDP & 2FA', 'Logs audit & BDD', 'Paramètres']
    }
  ];

  readonly rolePresets: RolePreset[] = [
    {
      name: 'Avocat Associé',
      roles: [UserRole.ASSOCIE, UserRole.AVOCAT],
      isPartner: true,
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16'
    },
    {
      name: 'Avocat Titulaire',
      roles: [UserRole.AVOCAT],
      isPartner: false,
      icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9'
    },
    {
      name: 'Collaborateur (Collab.)',
      roles: [UserRole.COLLABORATEUR],
      isPartner: false,
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586'
    },
    {
      name: 'Responsable Conformité (Compliance)',
      roles: [UserRole.COMPLIANCE_OFFICER],
      isPartner: false,
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944'
    },
    {
      name: 'Avocat & Compliance',
      roles: [UserRole.AVOCAT, UserRole.COMPLIANCE_OFFICER],
      isPartner: false,
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944'
    },
    {
      name: 'Secrétariat Juridique',
      roles: [UserRole.SECRETARIAT],
      isPartner: false,
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
    },
    {
      name: 'Administrateur',
      roles: [UserRole.ADMIN],
      isPartner: false,
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0'
    }
  ];

  constructor() {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(60)]],
      lastName: ['', [Validators.required, Validators.maxLength(60)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      isActive: [true],
      isPartner: [false],
      barreauId: [''],
      phoneNumber: [''],
      gsm: [''],
      address: [''],
      tempPassword: [''],
      preferredLanguage: ['fr']
    });
  }

  openUserform(user?: User) {
    this.showDialog = true;
    this.isEditMode = !!user;
    this.activeTab = 'identity';
    this.passwordCopied = false;
    this.isSubmitting = false;

    if (user) {
      this.currentUserId = user.id;
      this.photoData = user.photo || null;
      this.photoPreviewUrl = user.avatarUrl || user.photoBlob || null;

      // Extract roles
      if (user.roles && user.roles.length > 0) {
        this.selectedRoles = user.roles.map(r => String(r));
      } else if (user.role) {
        this.selectedRoles = String(user.role).split(',').map(r => r.trim()).filter(r => !!r);
      } else {
        this.selectedRoles = [UserRole.COLLABORATEUR];
      }

      this.userForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        isActive: user.isActive !== false,
        isPartner: user.isPartner === true,
        barreauId: user.barreauId || '',
        phoneNumber: user.phoneNumber || '',
        gsm: user.gsm || '',
        address: user.address || '',
        tempPassword: '',
        preferredLanguage: 'fr'
      });
    } else {
      this.currentUserId = null;
      this.photoData = null;
      this.photoPreviewUrl = null;
      this.selectedRoles = [UserRole.COLLABORATEUR];
      this.userForm.reset({
        isActive: true,
        isPartner: false,
        preferredLanguage: 'fr'
      });
    }
  }

  closeUserForm() {
    this.showDialog = false;
  }

  setTab(tab: 'identity' | 'contact' | 'roles' | 'security') {
    this.activeTab = tab;
  }

  isRoleSelected(roleId: string): boolean {
    return this.selectedRoles.includes(roleId);
  }

  toggleRole(roleId: string) {
    if (this.isRoleSelected(roleId)) {
      if (this.selectedRoles.length > 1) {
        this.selectedRoles = this.selectedRoles.filter(r => r !== roleId);
      } else {
        this.alertService.displayMessage('Attention', 'L\'utilisateur doit avoir au moins un rôle assigné.', 'warning');
      }
    } else {
      this.selectedRoles.push(roleId);
      if (roleId === UserRole.ASSOCIE) {
        this.userForm.patchValue({ isPartner: true });
      }
    }
  }

  applyPreset(preset: RolePreset) {
    this.selectedRoles = preset.roles.map(r => String(r));
    this.userForm.patchValue({ isPartner: preset.isPartner });
  }

  getRoleDefinition(roleId: string): UserRoleDefinition | undefined {
    return this.availableRoles.find(r => r.id === roleId);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.alertService.displayMessage('Fichier trop volumineux', 'La taille maximale de la photo est de 5 Mo.', 'error');
        return;
      }
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

  removePhoto() {
    this.photoData = null;
    this.photoPreviewUrl = null;
  }

  generatePassword() {
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercase = "abcdefghijkmnopqrstuvwxyz";
    const numbers = "23456789";
    const symbols = "!@#$%*?";
    const all = uppercase + lowercase + numbers + symbols;

    let password = "";
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));

    for (let i = 4; i < 14; i++) {
      password += all.charAt(Math.floor(Math.random() * all.length));
    }
    // Shuffle
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    this.userForm.patchValue({ tempPassword: password });
    this.passwordCopied = false;
  }

  copyPassword() {
    const pwd = this.userForm.get('tempPassword')?.value;
    if (pwd) {
      navigator.clipboard.writeText(pwd).then(() => {
        this.passwordCopied = true;
        setTimeout(() => this.passwordCopied = false, 3000);
      });
    }
  }

  onSubmit() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.alertService.displayMessage('Formulaire incomplet', 'Veuillez vérifier les champs obligatoires (Nom, Prénom, Email, Nom d\'utilisateur).', 'warning');
      return;
    }

    if (this.selectedRoles.length === 0) {
      this.activeTab = 'roles';
      this.alertService.displayMessage('Rôle manquant', 'Veuillez sélectionner au moins un rôle pour cet utilisateur.', 'warning');
      return;
    }

    this.isSubmitting = true;
    const formValue = this.userForm.value;

    const userData: any = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      username: formValue.username,
      role: this.selectedRoles[0] || UserRole.COLLABORATEUR,
      roles: this.selectedRoles,
      barreauId: formValue.barreauId,
      phoneNumber: formValue.phoneNumber,
      gsm: formValue.gsm,
      address: formValue.address,
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
        id: this.currentUserId 
      };

      this.userService.update(userToUpdate).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.alertService.success('Utilisateur mis à jour avec succès');
          this.closeUserForm();
          this.userSaved.emit();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.alertService.displayMessage('Erreur', 'Impossible de mettre à jour l\'utilisateur : ' + (err?.error?.message || err?.message || 'Erreur inconnue'), 'error');
        }
      });
    } else {
      const newUser: User = {
        ...userData,
        createdAt: new Date(),
        twoFactorEnabled: false
      };

      this.userService.create(newUser).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.alertService.success('Utilisateur créé avec succès');
          this.closeUserForm();
          this.userSaved.emit();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.alertService.displayMessage('Erreur', 'Impossible de créer l\'utilisateur : ' + (err?.error?.message || err?.message || 'Erreur inconnue'), 'error');
        }
      });
    }
  }
}
