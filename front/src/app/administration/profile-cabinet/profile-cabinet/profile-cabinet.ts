import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CabinetProfileService } from '../../../services/cabinet-profile.service';
import { AlertService } from '../../../services/alert-service';
import { CabinetProfile } from '../../../appTypes';

@Component({
  selector: 'app-profile-cabinet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-cabinet.html',
  styleUrl: './profile-cabinet.css'
})
export class ProfileCabinet implements OnInit {
  profileForm!: FormGroup;
  private fb = inject(FormBuilder);
  private profileService = inject(CabinetProfileService);
  private alertService = inject(AlertService);
  isLoading = true;

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      address: [''],
      city: [''],
      postalCode: [''],
      country: [''],
      phone: [''],
      email: ['', Validators.email],
      website: [''],
      siret: [''],
      vatNumber: [''],
      iban: [''],
      bic: [''],
      logo: [null],
      logoContentType: [null],
      currency: ['EUR', Validators.required],
      tvaRate: [20, [Validators.required, Validators.min(0), Validators.max(100)]]
    });

    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        if (profile) {
          this.profileForm.patchValue(profile);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement du profil', err);
        this.alertService.displayMessage('Erreur', 'Impossible de charger le profil', 'error');
        this.isLoading = false;
      }
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.alertService.displayMessage('Formulaire invalide', 'Veuillez vérifier les champs obligatoires.', 'warning');
      return;
    }

    this.alertService.confirmMessage(
      'Sauvegarder le profil',
      'Voulez-vous vraiment enregistrer les modifications apportées au profil du cabinet ?',
      'question'
    ).then((confirmed) => {
      if (confirmed) {
        const profileData: CabinetProfile = this.profileForm.value;
        this.profileService.updateProfile(profileData).subscribe({
          next: (updatedProfile) => {
            this.profileForm.patchValue(updatedProfile);
            this.alertService.success('Profil du cabinet mis à jour avec succès.');
          },
          error: (err) => {
            console.error('Erreur lors de la sauvegarde du profil', err);
            this.alertService.displayMessage('Erreur', 'Impossible de sauvegarder le profil', 'error');
          }
        });
      }
    });
  }

  get logoPreview(): string | null {
    const logo = this.profileForm.get('logo')?.value;
    const contentType = this.profileForm.get('logoContentType')?.value;
    if (logo && contentType) {
      return `data:${contentType};base64,${logo}`;
    }
    return null;
  }

  onLogoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const result = e.target.result as string;
        const base64Index = result.indexOf('base64,') + 7;
        const base64 = result.substring(base64Index);
        
        this.profileForm.patchValue({
          logo: base64,
          logoContentType: file.type
        });
        this.profileForm.markAsDirty();
      };
      reader.readAsDataURL(file);
    }
  }
}
