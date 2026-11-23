import { Component, Input, OnChanges, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DeadlineRule, DeadlineService, DossierDeadline } from '../../services/deadline.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dossier-deadlines',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dossier-deadlines.component.html'
})
export class DossierDeadlinesComponent implements OnInit, OnChanges {
  @Input() dossierId!: string | number;
  @Input() selectedDossier: any;
  @Input() users: any[] = [];

  private deadlineService = inject(DeadlineService);
  private http = inject(HttpClient);

  rules = signal<DeadlineRule[]>([]);
  deadlines = signal<DossierDeadline[]>([]);
  dossierDocuments = signal<any[]>([]);
  isLoading = signal<boolean>(false);
  isDetecting = signal<boolean>(false);
  aiProposals = signal<DossierDeadline[]>([]);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Formulaire calculateur
  selectedPays = 'FRANCE';
  selectedRuleId: number | null = null;
  titre = '';
  categorie = 'APPEL';
  triggerEventLabel = '';
  dateDepart = new Date().toISOString().slice(0, 10);
  delaiDistanceMois = 0;
  alsaceMoselle = false;
  suspensionJours = 0;
  criticite = 'CRITIQUE';
  responsableId = '';
  suppleantId = '';
  syncAgenda = true;

  // Mode délai personnalisé (si aucune règle sélectionnée)
  customDureeValeur = 30;
  customDureeUnite: 'DAYS' | 'MONTHS' | 'YEARS' = 'DAYS';
  customProrogeWeekendFerie = true;
  customEstFranc = false;
  customBaseLegale = '';

  previewResult = signal<DossierDeadline | null>(null);

  // Détection IA sur pièce
  selectedDocumentIdForAi: number | null = null;

  paysOptions = ['FRANCE', 'LUXEMBOURG', 'BELGIQUE', 'SUISSE', 'ALLEMAGNE', 'INTERNATIONAL'];

  ngOnInit(): void {
    this.syncFromDossier();
    this.loadRules();
    this.loadDeadlines();
    this.loadDossierDocuments();
  }

  ngOnChanges(): void {
    this.syncFromDossier();
    this.loadRules();
    this.loadDeadlines();
    this.loadDossierDocuments();
  }

  private syncFromDossier(): void {
    if (this.selectedDossier?.paysJuridiction) {
      this.selectedPays = this.selectedDossier.paysJuridiction;
    }
    if (this.selectedDossier?.responsableId && !this.responsableId) {
      this.responsableId = String(this.selectedDossier.responsableId);
    }
  }

  loadRules(): void {
    this.deadlineService.getRules(this.selectedPays).subscribe({
      next: (list) => {
        this.rules.set(list || []);
        if (list && list.length > 0 && !list.some(r => r.id === this.selectedRuleId)) {
          this.selectedRuleId = list[0].id;
          this.onRuleChange();
        } else {
          this.computePreview();
        }
      },
      error: () => this.rules.set([])
    });
  }

  loadDeadlines(): void {
    if (!this.dossierId) return;
    this.isLoading.set(true);
    this.deadlineService.findByDossier(this.dossierId).subscribe({
      next: (list) => {
        this.deadlines.set(list || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadDossierDocuments(): void {
    if (!this.dossierId) return;
    this.http.get<any>(`${environment.apiUrl}documents/search?dossier.id=${this.dossierId}&size=50`).subscribe({
      next: (res) => {
        const docs = res?.content || [];
        this.dossierDocuments.set(docs);
        if (docs.length > 0 && !this.selectedDocumentIdForAi) {
          this.selectedDocumentIdForAi = docs[0].id;
        }
      },
      error: () => this.dossierDocuments.set([])
    });
  }

  onPaysChange(): void {
    this.selectedRuleId = null;
    this.loadRules();
  }

  onRuleChange(): void {
    const rule = this.rules().find(r => r.id === Number(this.selectedRuleId));
    if (rule) {
      this.titre = rule.libelle;
      this.categorie = rule.categorie;
      this.criticite = rule.criticiteDefaut || 'CRITIQUE';
      this.triggerEventLabel = rule.description || '';
    }
    this.computePreview();
  }

  buildPayload(): DossierDeadline {
    return {
      dossierId: Number(this.dossierId),
      ruleId: this.selectedRuleId ? Number(this.selectedRuleId) : null,
      pays: this.selectedPays,
      titre: this.titre,
      categorie: this.categorie,
      triggerEventLabel: this.triggerEventLabel,
      dateDepart: this.dateDepart,
      delaiDistanceMois: Number(this.delaiDistanceMois) || 0,
      alsaceMoselle: this.alsaceMoselle,
      suspensionJours: Number(this.suspensionJours) || 0,
      criticite: this.criticite,
      responsableId: this.responsableId || undefined,
      suppleantId: this.suppleantId || undefined,
      syncAgenda: this.syncAgenda,
      customDureeValeur: this.selectedRuleId ? undefined : Number(this.customDureeValeur),
      customDureeUnite: this.selectedRuleId ? undefined : this.customDureeUnite,
      customProrogeWeekendFerie: this.selectedRuleId ? undefined : this.customProrogeWeekendFerie,
      customEstFranc: this.selectedRuleId ? undefined : this.customEstFranc,
      baseLegale: this.selectedRuleId ? undefined : this.customBaseLegale
    };
  }

  computePreview(): void {
    if (!this.dateDepart) return;
    this.errorMessage.set(null);
    this.deadlineService.preview(this.buildPayload()).subscribe({
      next: (res) => this.previewResult.set(res),
      error: (err) => this.errorMessage.set(err?.error?.message || 'Erreur lors du calcul du délai.')
    });
  }

  saveDeadline(): void {
    if (!this.dossierId || !this.dateDepart) return;
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.deadlineService.create(this.buildPayload()).subscribe({
      next: (created) => {
        this.successMessage.set(`Délai validé et enregistré (échéance le ${created.dateEcheanceFinale}).`);
        this.loadDeadlines();
      },
      error: (err) => this.errorMessage.set(err?.error?.message || 'Impossible d\'enregistrer ce délai.')
    });
  }

  detectWithAi(): void {
    if (!this.dossierId || !this.selectedDocumentIdForAi) return;
    this.isDetecting.set(true);
    this.errorMessage.set(null);
    this.aiProposals.set([]);
    this.deadlineService.detectFromDocument(this.dossierId, this.selectedDocumentIdForAi).subscribe({
      next: (list) => {
        this.aiProposals.set(list || []);
        this.isDetecting.set(false);
        if (!list || list.length === 0) {
          this.errorMessage.set('Aucune date déclencheuse certaine détectée dans cette pièce.');
        }
      },
      error: (err) => {
        this.isDetecting.set(false);
        this.errorMessage.set(err?.error?.message || 'Erreur lors de l\'analyse IA de la pièce.');
      }
    });
  }

  validateAiProposal(proposal: DossierDeadline): void {
    this.deadlineService.create({
      ...proposal,
      dossierId: Number(this.dossierId),
      responsableId: this.responsableId || undefined,
      suppleantId: this.suppleantId || undefined,
      syncAgenda: true
    }).subscribe({
      next: () => {
        this.aiProposals.set(this.aiProposals().filter(p => p !== proposal));
        this.successMessage.set(`Proposition IA validée et ajoutée au dossier : ${proposal.titre}`);
        this.loadDeadlines();
      }
    });
  }

  completeDeadline(d: DossierDeadline): void {
    if (!d.id) return;
    const justificatif = window.prompt('Référence de l\'acte / preuve d\'accomplissement (ex. numéro RPVA, date d\'envoi) :', '') ?? '';
    this.deadlineService.complete(d.id, justificatif).subscribe({
      next: () => this.loadDeadlines()
    });
  }

  interruptDeadline(d: DossierDeadline): void {
    if (!d.id) return;
    const motif = window.prompt('Motif de l\'interruption (ex. nouvelle diligence, conclusions déposées, médiation) :', 'Nouvelle diligence accomplie');
    if (motif === null) return;
    const relancer = d.ruleId ? window.confirm('Voulez-vous relancer automatiquement un nouveau délai à compter d\'aujourd\'hui ?') : false;
    this.deadlineService.interrupt(d.id, new Date().toISOString().slice(0, 10), motif, relancer).subscribe({
      next: () => this.loadDeadlines()
    });
  }

  deleteDeadline(d: DossierDeadline): void {
    if (!d.id || !window.confirm(`Supprimer le délai « ${d.titre} » ?`)) return;
    this.deadlineService.delete(d.id).subscribe({
      next: () => this.loadDeadlines()
    });
  }

  countdownBadgeClass(d: DossierDeadline): string {
    if (d.statut === 'ACCOMPLI') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (d.statut !== 'ACTIF') return 'bg-slate-100 text-slate-600 border-slate-200';
    const j = d.joursRestants ?? 999;
    if (j < 0) return 'bg-red-600 text-white border-red-700 animate-pulse';
    if (j <= 3) return 'bg-red-100 text-red-800 border-red-300 font-black';
    if (j <= 15) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }
}
