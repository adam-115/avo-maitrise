import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DeadlineRule, DeadlineService } from '../../services/deadline.service';

@Component({
  selector: 'app-deadline-rules-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './deadline-rules-admin.component.html'
})
export class DeadlineRulesAdminComponent implements OnInit {
  private deadlineService = inject(DeadlineService);

  rules = signal<DeadlineRule[]>([]);
  isLoading = signal<boolean>(false);
  searchTerm = signal<string>('');
  filterPays = signal<string>('');
  filterCategorie = signal<string>('');

  showEditor = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  form: Partial<DeadlineRule> = this.emptyForm();

  readonly paysOptions = ['FRANCE', 'LUXEMBOURG', 'BELGIQUE', 'SUISSE', 'ALLEMAGNE', 'INTERNATIONAL'];
  readonly categories = ['APPEL', 'PRESCRIPTION', 'PEREMPTION', 'POURVOI', 'CONCLUSIONS', 'RECOURS', 'OPPOSITION', 'AUTRE'];
  readonly domaines = ['ALL', 'CIV', 'SOC', 'AFF', 'PEN', 'ADM', 'FAM', 'IMM', 'FIS'];
  readonly criticites = ['CRITIQUE', 'HAUTE', 'NORMALE'];

  filteredRules = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    const p = this.filterPays();
    const c = this.filterCategorie();
    return this.rules().filter(r => {
      if (p && r.pays !== p) return false;
      if (c && r.categorie !== c) return false;
      if (q && !(
        (r.libelle || '').toLowerCase().includes(q) ||
        (r.code || '').toLowerCase().includes(q) ||
        (r.baseLegale || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q)
      )) return false;
      return true;
    });
  });

  ngOnInit(): void {
    this.loadRules();
  }

  emptyForm(): Partial<DeadlineRule> {
    return {
      code: '',
      pays: 'FRANCE',
      domaineCode: 'ALL',
      categorie: 'APPEL',
      libelle: '',
      description: '',
      dureeValeur: 1,
      dureeUnite: 'MONTHS',
      prorogeWeekendFerie: true,
      estFranc: false,
      criticiteDefaut: 'CRITIQUE',
      baseLegale: '',
      sourceUrl: ''
    };
  }

  loadRules(): void {
    this.isLoading.set(true);
    this.deadlineService.getRules().subscribe({
      next: (list) => {
        this.rules.set(list || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Impossible de charger les règles de délais.');
      }
    });
  }

  openCreate(): void {
    this.form = this.emptyForm();
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.showEditor.set(true);
  }

  openEdit(rule: DeadlineRule): void {
    this.form = { ...rule };
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.showEditor.set(true);
  }

  closeEditor(): void {
    this.showEditor.set(false);
  }

  save(): void {
    if (!this.form.libelle?.trim()) {
      this.errorMessage.set('Le libellé de la règle est obligatoire.');
      return;
    }
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.deadlineService.saveRule(this.form).subscribe({
      next: (saved) => {
        this.isSaving.set(false);
        this.showEditor.set(false);
        this.successMessage.set(this.form.id
          ? `Règle « ${saved.libelle} » mise à jour.`
          : `Règle « ${saved.libelle} » ajoutée au référentiel.`);
        this.loadRules();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err?.error?.message || 'Erreur lors de l\'enregistrement de la règle.');
      }
    });
  }

  deleteRule(rule: DeadlineRule): void {
    if (!rule.id || !window.confirm(`Supprimer la règle « ${rule.libelle} » ?`)) return;
    this.deadlineService.deleteRule(rule.id).subscribe({
      next: () => {
        this.successMessage.set(`Règle « ${rule.libelle} » supprimée.`);
        this.loadRules();
      },
      error: () => this.errorMessage.set('Impossible de supprimer cette règle.')
    });
  }

  uniteLabel(u: string): string {
    if (u === 'DAYS') return 'jour(s)';
    if (u === 'MONTHS') return 'mois';
    if (u === 'YEARS') return 'an(s)';
    return u;
  }
}
