import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { SecteurActivite } from '../../appTypes';
import { AlertService } from './../../services/alert-service';
import { SecteurActiviteService } from './../../services/secteur-activite-service';
import { NavigationService } from './../../services/navigation-service';

@Component({
  selector: 'app-secteur-activite',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslatePipe],
  templateUrl: './secteur-activite.html',
  styleUrl: './secteur-activite.css',
})
export class SecteurActiviteComponent implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);
  private alertService = inject(AlertService);
  private secteurActiviteService = inject(SecteurActiviteService);
  private navigationService = inject(NavigationService);

  secteurs: SecteurActivite[] = [];
  selectedSecteurActivite: SecteurActivite | null = null;
  secteurForm: FormGroup = new FormGroup({});
  
  searchTerm: string = '';
  filterStatus: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';
  errorMessage: string = '';

  ngOnInit(): void {
    this.secteurForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(2)]],
      libelle: ['', [Validators.required, Validators.minLength(2)]],
      ordre_affichage: [1, [Validators.required, Validators.min(0)]],
      actif: [true]
    });
    this.loadAllSecteurActivite();
  }

  navigateBackToPreferences(): void {
    this.navigationService.navigateToAdminPrefences();
  }

  loadAllSecteurActivite(): void {
    this.secteurActiviteService.getAll().subscribe({
      next: (data) => {
        const raw = data.content || (Array.isArray(data) ? data : []);
        this.secteurs = raw.sort((a, b) => (a.ordreAffichage || 0) - (b.ordreAffichage || 0));
      },
      error: (err) => {
        console.error('Error loading secteurs', err);
        this.errorMessage = 'Erreur lors du chargement des secteurs d\'activité.';
        this.alertService.displayMessage('Erreur', this.errorMessage, 'error');
      }
    });
  }

  get totalCount(): number {
    return this.secteurs?.length || 0;
  }

  get activeCount(): number {
    return (this.secteurs || []).filter(s => s.actif).length;
  }

  get inactiveCount(): number {
    return (this.secteurs || []).filter(s => !s.actif).length;
  }

  get filteredSecteurs(): SecteurActivite[] {
    return (this.secteurs || []).filter(s => {
      const matchSearch = this.searchTerm
        ? ((s.libelle || '').toLowerCase().includes(this.searchTerm.toLowerCase()) || (s.code || '').toLowerCase().includes(this.searchTerm.toLowerCase()))
        : true;
      const matchStatus = this.filterStatus === 'ALL'
        ? true
        : this.filterStatus === 'ACTIVE'
          ? !!s.actif
          : !s.actif;
      return matchSearch && matchStatus;
    });
  }

  private formToSecteur(): SecteurActivite {
    const formValues = this.secteurForm.getRawValue();
    return {
      ...(this.selectedSecteurActivite?.id && { id: this.selectedSecteurActivite.id }),
      code: (formValues.code || '').toUpperCase().trim(),
      libelle: (formValues.libelle || '').trim(),
      ordreAffichage: Number(formValues.ordre_affichage) || 0,
      actif: Boolean(formValues.actif),
    };
  }

  private secteurToForm(secteur: SecteurActivite): void {
    this.secteurForm.patchValue({
      code: secteur.code,
      libelle: secteur.libelle,
      ordre_affichage: secteur.ordreAffichage,
      actif: secteur.actif
    });
  }

  selectSecteur(selectedSecteur: SecteurActivite): void {
    this.selectedSecteurActivite = selectedSecteur;
    this.secteurToForm(selectedSecteur);

    const formCard = document.getElementById('secteurFormCard');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async toggleSecteurActive(secteur: SecteurActivite): Promise<void> {
    if (!secteur.id) return;
    const newStatus = !secteur.actif;
    const title = newStatus ? 'Réactivation' : 'Désactivation';
    const message = newStatus
      ? 'Voulez-vous réactiver ce secteur d\'activité ?'
      : 'Êtes-vous sûr de vouloir désactiver ce secteur d\'activité ?';

    const isConfirmed = await this.alertService.confirmMessage(title, message, 'warning');
    if (isConfirmed) {
      const updatedSecteur: SecteurActivite = { ...secteur, actif: newStatus };
      this.secteurActiviteService.update(updatedSecteur).subscribe({
        next: () => {
          this.alertService.success(newStatus ? 'Secteur réactivé avec succès' : 'Secteur désactivé avec succès');
          this.loadAllSecteurActivite();
        },
        error: (err) => {
          console.error('Error toggling secteur active', err);
          this.alertService.displayMessage('Erreur', 'Impossible de modifier le statut.', 'error');
        }
      });
    }
  }

  async deleteSecteur(id: number): Promise<void> {
    const secteur = this.secteurs.find(s => s.id === id);
    if (secteur) {
      await this.toggleSecteurActive(secteur);
    }
  }

  resetForm(): void {
    this.selectedSecteurActivite = null;
    const nextOrder = (this.secteurs.length > 0 ? Math.max(...this.secteurs.map(s => s.ordreAffichage || 0)) + 1 : 1);
    this.secteurForm.reset({
      code: '',
      libelle: '',
      ordre_affichage: nextOrder,
      actif: true
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const content = e.target.result;
        this.parseCSV(content);
      };
      reader.readAsText(file);
    }
  }

  private parseCSV(csvText: string): void {
    const lines = csvText.split('\n');
    const result: SecteurActivite[] = [];

    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].split(',');
      if (currentLine.length >= 2) {
        const code = currentLine[0].trim().toUpperCase();
        const libelle = currentLine[1].trim();
        if (code && libelle) {
          const secteur: SecteurActivite = {
            code: code,
            libelle: libelle,
            ordreAffichage: currentLine[2] ? Number(currentLine[2]) : (result.length + 1),
            actif: currentLine[3] ? currentLine[3].trim().toLowerCase() === 'true' : true
          };
          result.push(secteur);
        }
      }
    }

    if (result.length > 0) {
      this.importSecteurs(result);
    }
  }

  private importSecteurs(secteurs: SecteurActivite[]): void {
    let completed = 0;
    secteurs.forEach(s => {
      this.secteurActiviteService.create(s).subscribe({
        next: () => {
          completed++;
          if (completed === secteurs.length) {
            this.loadAllSecteurActivite();
            this.alertService.success(`${secteurs.length} secteurs d'activité importés avec succès`);
          }
        },
        error: () => this.alertService.displayMessage('Erreur', `Erreur lors de l'import du code ${s.code}`, 'error')
      });
    });
  }

  submit(): void {
    if (this.secteurForm.valid) {
      if (this.selectedSecteurActivite == null) {
        const newSecteurActivity = this.formToSecteur();
        this.secteurActiviteService.create(newSecteurActivity).subscribe({
          next: () => {
            this.alertService.success('Secteur d\'activité créé avec succès');
            this.loadAllSecteurActivite();
            this.resetForm();
          },
          error: (err) => {
            console.error('Error creating secteur', err);
            this.alertService.displayMessage('Erreur', 'Erreur lors de la création.', 'error');
          }
        });
      } else {
        const updatedSecteurActivity = this.formToSecteur();
        updatedSecteurActivity.id = this.selectedSecteurActivite.id;
        this.secteurActiviteService.update(updatedSecteurActivity).subscribe({
          next: () => {
            this.alertService.success('Secteur d\'activité mis à jour avec succès');
            this.loadAllSecteurActivite();
            this.resetForm();
          },
          error: (err) => {
            console.error('Error updating secteur', err);
            this.alertService.displayMessage('Erreur', 'Erreur lors de la mise à jour.', 'error');
          }
        });
      }
    } else {
      this.secteurForm.markAllAsTouched();
    }
  }
}
