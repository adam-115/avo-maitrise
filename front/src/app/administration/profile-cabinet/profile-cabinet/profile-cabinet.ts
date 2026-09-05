import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CabinetProfileService } from '../../../services/cabinet-profile.service';
import { AlertService } from '../../../services/alert-service';
import { NavigationService } from '../../../services/navigation-service';
import { CabinetProfile } from '../../../appTypes';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-profile-cabinet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './profile-cabinet.html',
  styleUrl: './profile-cabinet.css'
})
export class ProfileCabinet implements OnInit {
  profileForm!: FormGroup;
  private fb = inject(FormBuilder);
  private profileService = inject(CabinetProfileService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  
  isLoading = true;
  isSaving = false;

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      id: [null],
      name: ['', [Validators.required, Validators.minLength(2)]],
      siret: [''],
      vatNumber: [''],
      website: [''],
      email: ['', [Validators.email]],
      phone: [''],
      address: [''],
      city: [''],
      postalCode: [''],
      country: [''],
      currency: ['EUR', Validators.required],
      tvaRate: [20, [Validators.required, Validators.min(0), Validators.max(100)]],
      iban: [''],
      bic: [''],
      logo: [null],
      logoContentType: [null]
    });

    this.loadProfile();
  }

  navigateBackToAdmin(): void {
    this.router.navigate([NavigationService.HOME, NavigationService.ADMINSTRATION]);
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

  get hasLogo(): boolean {
    return !!this.profileForm.get('logo')?.value;
  }

  get firmName(): string {
    return this.profileForm.get('name')?.value || 'Mon Cabinet';
  }

  get locationSummary(): string {
    const city = this.profileForm.get('city')?.value;
    const country = this.profileForm.get('country')?.value;
    if (city && country) return `${city}, ${country}`;
    if (city) return city;
    if (country) return country;
    return 'Non configuré';
  }

  get currencyAndVatSummary(): string {
    const curr = this.profileForm.get('currency')?.value || 'EUR';
    const vat = this.profileForm.get('tvaRate')?.value ?? 20;
    return `${curr} • TVA ${vat}%`;
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.alertService.displayMessage('Formulaire incomplet', 'Veuillez vérifier les champs obligatoires du profil.', 'warning');
      this.profileForm.markAllAsTouched();
      return;
    }

    this.alertService.confirmMessage(
      'Sauvegarder le profil',
      'Voulez-vous vraiment enregistrer les modifications apportées au profil du cabinet ?',
      'question'
    ).then((confirmed) => {
      if (confirmed) {
        this.isSaving = true;
        const profileData: CabinetProfile = this.profileForm.value;
        this.profileService.updateProfile(profileData).subscribe({
          next: (updatedProfile) => {
            this.profileForm.patchValue(updatedProfile);
            this.alertService.success('Profil du cabinet et identité visuelle mis à jour avec succès.');
            this.isSaving = false;
          },
          error: (err) => {
            console.error('Erreur lors de la sauvegarde du profil', err);
            this.alertService.displayMessage('Erreur', 'Impossible de sauvegarder le profil', 'error');
            this.isSaving = false;
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

  removeLogo(): void {
    this.profileForm.patchValue({
      logo: null,
      logoContentType: null
    });
    this.profileForm.markAsDirty();
  }
}
