import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SecteurActivite } from '../../appTypes';
import { AlertService } from './../../services/alert-service';
import { SecteurActiviteService } from './../../services/secteur-activite-service';

@Component({
  selector: 'app-secteur-activite',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './secteur-activite.html',
  styleUrl: './secteur-activite.css',
})
export class SecteurActiviteComponent implements OnInit {
  fb: FormBuilder = inject(FormBuilder);
  alertService = inject(AlertService);
  secteurActiviteService = inject(SecteurActiviteService);
  secteurs: SecteurActivite[] = [];
  selectedSecteurActivite: SecteurActivite | null = null;
  secteurForm: FormGroup = new FormGroup({});

  ngOnInit(): void {
    this.secteurForm = this.fb.group({
      code: ["", Validators.required],
      libelle: ["", Validators.required],
      ordre_affichage: [0, Validators.required],
      actif: [true]
    });
    this.lodAllSeteurActivite();
  }


  private lodAllSeteurActivite() {
    this.secteurActiviteService.getAll().subscribe(data => {
      this.secteurs = data;
    })
  }


  // Convertir les données du formulaire vers l'interface SecteurActivite
  private formToSecteur(): SecteurActivite {
    const formValues = this.secteurForm.getRawValue(); // Récupère toutes les valeurs, même si désactivées
    return {
      // Si on est en édition, on conserve l'ID de l'objet sélectionné
      ...(this.selectedSecteurActivite?.id && { id: this.selectedSecteurActivite.id }),
      code: formValues.code,
      libelle: formValues.libelle,
      ordre_affichage: Number(formValues.ordre_affichage),
      actif: Boolean(formValues.actif),
      // created_at est généralement géré par le backend
    };
  }

  // Convertir un objet SecteurActivite pour remplir le formulaire
  private secteurToForm(secteur: SecteurActivite): void {
    this.secteurForm.patchValue({
      code: secteur.code,
      libelle: secteur.libelle,
      ordre_affichage: secteur.ordre_affichage,
      actif: secteur.actif
    });
  }

  selectSecteur(selectedSecteur: SecteurActivite) {
    this.selectedSecteurActivite = selectedSecteur;
    this.secteurToForm(selectedSecteur);
  }

  resetForm() {
    this.selectedSecteurActivite = null;
    this.secteurForm.reset();
  }


  // Ajoutez cette méthode dans votre classe SecteurActiviteComponent

onFileSelected(event: any) {
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

private parseCSV(csvText: string) {
  const lines = csvText.split('\n');
  const result: SecteurActivite[] = [];

  // On suppose que le CSV a une ligne d'entête : code,libelle,ordre,actif
  // Exemple : IMMO,Immobilier,1,true
  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i].split(',');
    if (currentLine.length >= 2) {
      const secteur: SecteurActivite = {
        code: currentLine[0].trim(),
        libelle: currentLine[1].trim(),
        ordre_affichage: currentLine[2] ? Number(currentLine[2]) : 0,
        actif: currentLine[3] ? currentLine[3].trim().toLowerCase() === 'true' : true
      };
      result.push(secteur);
    }
  }

  if (result.length > 0) {
    this.importSecteurs(result);
  }
}

private importSecteurs(secteurs: SecteurActivite[]) {
  // Ici, vous pouvez soit faire un appel API "bulk" (si votre backend le supporte)
  // Soit boucler sur les créations. Exemple simple par boucle :
  let completed = 0;
  secteurs.forEach(s => {
    this.secteurActiviteService.create(s).subscribe({
      next: () => {
        completed++;
        if (completed === secteurs.length) {
          this.lodAllSeteurActivite();
          this.alertService.success(`${secteurs.length} secteurs importés avec succès`);
        }
      },
      error: () => this.alertService.displayMessage('Error',`Erreur lors de l'import du code ${s.code}`,'error')
    });
  });
}

  submit() {
    if (this.secteurForm.valid) {
      if (this.selectedSecteurActivite == null) {
        let newSecteurActivity = this.formToSecteur();
        this.secteurActiviteService.create(newSecteurActivity).subscribe(data => {
          this.lodAllSeteurActivite();
          this.alertService.success("element bien ajouté ");
        });
      } else {
        let updatedSecteurActivity = this.formToSecteur();
        updatedSecteurActivity.id = this.selectedSecteurActivite.id;
        this.secteurActiviteService.update(updatedSecteurActivity.id, updatedSecteurActivity).subscribe(data => {
          this.lodAllSeteurActivite();
          this.alertService.success("elemet mis a jour");
        }
        );
      }
    }
  }

}
