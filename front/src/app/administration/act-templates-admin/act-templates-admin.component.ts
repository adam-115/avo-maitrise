import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ActService, ActTemplate } from '../../services/act.service';

@Component({
  selector: 'app-act-templates-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './act-templates-admin.component.html'
})
export class ActTemplatesAdminComponent implements OnInit {
  private actService = inject(ActService);

  templates = signal<ActTemplate[]>([]);
  isLoading = signal<boolean>(false);
  searchTerm = signal<string>('');
  filterPays = signal<string>('');
  filterCategorie = signal<string>('');

  showEditor = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  form: ActTemplate = this.emptyForm();

  readonly templatePlaceholder = 'Rédigez votre modèle d\'acte avec des variables {{client.nomComplet}}, {{adversaire.nomComplet}}, {{montant}}...';

  readonly paysOptions = ['FRANCE', 'LUXEMBOURG', 'BELGIQUE', 'SUISSE', 'ALLEMAGNE', 'ALL'];
  readonly categories = [
    'MISE_EN_DEMEURE', 'ASSIGNATION', 'REQUETE', 'CONCLUSIONS',
    'CONTRAT', 'CONVENTION_HONORAIRES', 'BORDEREAU', 'COURRIER'
  ];

  readonly variablePalette = [
    '{{cabinet.nom}}', '{{cabinet.adresse}}', '{{cabinet.codePostal}}', '{{cabinet.ville}}',
    '{{cabinet.telephone}}', '{{cabinet.email}}', '{{cabinet.website}}', '{{cabinet.siret}}',
    '{{cabinet.tva}}', '{{cabinet.iban}}', '{{cabinet.bic}}', '{{avocat.nom}}',
    '{{dossier.reference}}', '{{dossier.titre}}', '{{dossier.description}}', '{{dossier.pays}}',
    '{{client.qualite}}', '{{client.nomComplet}}', '{{client.adresse}}', '{{client.email}}', '{{client.telephone}}',
    '{{adversaire.nomComplet}}', '{{adversaire.adresse}}', '{{adversaire.rcs}}', '{{adversaire.representantLegal}}',
    '{{avocatAdverse.nomComplet}}', '{{pieces.nombre}}', '{{pieces.bordereau}}',
    '{{delais.prochaineEcheance}}', '{{dateJour}}', '{{dateJourLongue}}'
  ];

  filteredTemplates = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    const p = this.filterPays();
    const c = this.filterCategorie();
    return this.templates().filter(t => {
      if (p && t.pays !== p) return false;
      if (c && t.categorie !== c) return false;
      if (q && !(
        (t.titre || '').toLowerCase().includes(q) ||
        (t.code || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
      )) return false;
      return true;
    });
  });

  ngOnInit(): void {
    this.loadTemplates();
  }

  emptyForm(): ActTemplate {
    return {
      titre: '',
      code: '',
      categorie: 'MISE_EN_DEMEURE',
      pays: 'FRANCE',
      description: '',
      format: 'TEXT_TEMPLATE',
      content: ''
    };
  }

  loadTemplates(): void {
    this.isLoading.set(true);
    this.actService.listTemplates().subscribe({
      next: (list) => {
        this.templates.set(list || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Impossible de charger les modèles d\'actes.');
      }
    });
  }

  openCreate(): void {
    this.form = this.emptyForm();
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.showEditor.set(true);
  }

  openEdit(tpl: ActTemplate): void {
    this.form = { ...tpl, fileData: undefined };
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.showEditor.set(true);
  }

  closeEditor(): void {
    this.showEditor.set(false);
  }

  insertVariable(token: string): void {
    this.form.content = (this.form.content || '') + token;
  }

  onDocxSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.form.nomFichier = file.name;
    this.form.format = 'DOCX_FILE';
    const reader = new FileReader();
    reader.onload = () => {
      this.form.fileData = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  }

  save(): void {
    if (!this.form.titre?.trim()) {
      this.errorMessage.set('Le titre du modèle est obligatoire.');
      return;
    }
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.actService.saveTemplate(this.form).subscribe({
      next: (saved) => {
        this.isSaving.set(false);
        this.showEditor.set(false);
        this.successMessage.set(this.form.id
          ? `Modèle « ${saved.titre} » mis à jour avec succès.`
          : `Modèle « ${saved.titre} » créé avec succès.`);
        this.loadTemplates();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err?.error?.message || 'Erreur lors de l\'enregistrement du modèle.');
      }
    });
  }

  deleteTemplate(tpl: ActTemplate): void {
    if (!tpl.id || !window.confirm(`Supprimer le modèle « ${tpl.titre} » ?`)) return;
    this.actService.deleteTemplate(tpl.id).subscribe({
      next: () => {
        this.successMessage.set(`Modèle « ${tpl.titre} » supprimé.`);
        this.loadTemplates();
      },
      error: () => this.errorMessage.set('Impossible de supprimer ce modèle.')
    });
  }
}
