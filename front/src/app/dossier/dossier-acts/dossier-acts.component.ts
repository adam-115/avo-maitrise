import { Component, Input, OnChanges, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActPreviewResponse, ActService, ActTemplate } from '../../services/act.service';

@Component({
  selector: 'app-dossier-acts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dossier-acts.component.html'
})
export class DossierActsComponent implements OnInit, OnChanges {
  @Input() dossierId!: string | number;
  @Input() selectedDossier: any;

  private actService = inject(ActService);

  templates = signal<ActTemplate[]>([]);
  selectedTemplateId: number | null = null;
  preview = signal<ActPreviewResponse | null>(null);
  values: Record<string, string> = {};
  editedContent = '';
  customTitle = '';
  saveToDossier = true;

  isLoading = signal<boolean>(false);
  isGenerating = signal<boolean>(false);
  isEnhancing = signal<boolean>(false);
  aiInstruction = '';
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // Création d'un nouveau modèle (texte ou .docx)
  showNewTemplateModal = signal<boolean>(false);
  newTemplate: ActTemplate = {
    titre: '',
    categorie: 'MISE_EN_DEMEURE',
    pays: 'FRANCE',
    description: '',
    format: 'TEXT_TEMPLATE',
    content: ''
  };

  readonly templatePlaceholder = 'Rédigez votre modèle d\'acte avec des variables {{client.nomComplet}}, {{montant}}...';

  readonly variablePalette = [
    '{{cabinet.nom}}', '{{cabinet.adresse}}', '{{cabinet.codePostal}}', '{{cabinet.ville}}',
    '{{cabinet.telephone}}', '{{cabinet.email}}', '{{cabinet.website}}', '{{cabinet.siret}}',
    '{{cabinet.tva}}', '{{cabinet.iban}}', '{{cabinet.bic}}', '{{avocat.nom}}',
    '{{dossier.reference}}', '{{dossier.titre}}', '{{dossier.description}}',
    '{{client.qualite}}', '{{client.nomComplet}}', '{{client.adresse}}', '{{client.email}}',
    '{{adversaire.nomComplet}}', '{{adversaire.adresse}}', '{{adversaire.rcs}}',
    '{{pieces.bordereau}}', '{{delais.prochaineEcheance}}', '{{dateJourLongue}}'
  ];

  readonly categories = [
    'MISE_EN_DEMEURE', 'ASSIGNATION', 'REQUETE', 'CONCLUSIONS',
    'CONTRAT', 'CONVENTION_HONORAIRES', 'BORDEREAU', 'COURRIER'
  ];

  ngOnInit(): void {
    this.loadTemplates();
  }

  ngOnChanges(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    const pays = this.selectedDossier?.paysJuridiction || undefined;
    this.actService.listTemplates(pays).subscribe({
      next: (list) => {
        this.templates.set(list || []);
        if (list && list.length > 0 && !list.some(t => t.id === this.selectedTemplateId)) {
          this.selectedTemplateId = list[0].id!;
          this.onSelectTemplate();
        }
      },
      error: () => this.templates.set([])
    });
  }

  onSelectTemplate(): void {
    if (!this.selectedTemplateId || !this.dossierId) return;
    this.values = {};
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.refreshPreview(true);
  }

  refreshPreview(resetEdited = false): void {
    if (!this.selectedTemplateId || !this.dossierId) return;
    this.isLoading.set(true);
    this.actService.preview(this.selectedTemplateId, this.dossierId, this.values).subscribe({
      next: (res) => {
        this.preview.set(res);
        this.values = { ...res.variables };
        if (resetEdited || !this.customTitle) {
          this.customTitle = `${res.titre} - ${this.selectedDossier?.referenceInterne || ''}`.trim();
        }
        this.editedContent = res.previewText;
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Erreur lors de la prévisualisation du modèle.');
      }
    });
  }

  enhanceWithAi(): void {
    if (!this.dossierId || !this.editedContent) return;
    this.isEnhancing.set(true);
    this.errorMessage.set(null);
    this.actService.enhanceWithAi(this.dossierId, this.editedContent, this.aiInstruction).subscribe({
      next: (res) => {
        this.editedContent = res.result;
        this.isEnhancing.set(false);
        this.successMessage.set('Brouillon enrichi par l\'IA à partir du dossier. Merci de le relire avant export.');
      },
      error: (err) => {
        this.isEnhancing.set(false);
        this.errorMessage.set(err?.error?.message || 'Impossible d\'enrichir le brouillon avec l\'IA.');
      }
    });
  }

  generateDocx(): void {
    if (!this.selectedTemplateId || !this.dossierId) return;
    this.isGenerating.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.actService.generateDocx({
      templateId: this.selectedTemplateId,
      dossierId: Number(this.dossierId),
      customTitle: this.customTitle,
      editedContent: this.preview()?.format === 'TEXT_TEMPLATE' ? this.editedContent : undefined,
      values: this.values,
      saveToDossier: this.saveToDossier
    }).subscribe({
      next: (resp) => {
        this.isGenerating.set(false);
        const blob = resp.body;
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${(this.customTitle || 'acte').replace(/[^a-zA-Z0-9-_]/g, '_')}.docx`;
          a.click();
          URL.revokeObjectURL(url);
        }
        const savedId = resp.headers.get('X-Saved-Document-Id');
        this.successMessage.set(this.saveToDossier && savedId
          ? `Acte Word (.docx) téléchargé et classé dans les pièces du dossier (Document #${savedId}).`
          : 'Acte Word (.docx) téléchargé avec succès.');
      },
      error: (err) => {
        this.isGenerating.set(false);
        this.errorMessage.set(err?.error?.message || 'Erreur lors de la génération de l\'acte.');
      }
    });
  }

  printPdf(): void {
    const win = window.open('', '_blank');
    if (!win) return;
    const cab = this.preview()?.cabinet;
    const esc = (s?: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const logoHtml = cab?.logoDataUrl ? `<img src="${cab.logoDataUrl}" style="max-height:60px;max-width:160px;object-fit:contain;" />` : '';
    const cabHeaderHtml = cab ? `
      <header style="display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid #cbd5e1;padding-bottom:14px;margin-bottom:28px;">
        <div>${logoHtml}</div>
        <div style="text-align:right;font-family:sans-serif;font-size:10pt;color:#334155;">
          <div style="font-weight:700;font-size:12pt;color:#0f172a;">${esc(cab.name)}</div>
          <div>${esc(cab.address)} ${esc(cab.postalCode)} ${esc(cab.city)}</div>
          <div>${[cab.phone ? 'Tél. : ' + esc(cab.phone) : '', esc(cab.email)].filter(Boolean).join(' · ')}</div>
          ${cab.website ? `<div>${esc(cab.website)}</div>` : ''}
        </div>
      </header>` : '';
    const legalParts = cab ? [
      esc(cab.name),
      cab.siret ? 'SIRET : ' + esc(cab.siret) : '',
      cab.vatNumber ? 'TVA : ' + esc(cab.vatNumber) : '',
      cab.iban ? 'IBAN : ' + esc(cab.iban) : '',
      esc(cab.website)
    ].filter(Boolean).join('  |  ') : '';
    const cabFooterHtml = legalParts ? `
      <footer style="margin-top:36px;padding-top:10px;border-top:1px solid #cbd5e1;text-align:center;font-family:sans-serif;font-size:8.5pt;color:#64748b;">
        ${legalParts}
      </footer>` : '';

    win.document.write(`<!DOCTYPE html><html><head><title>${esc(this.customTitle)}</title>
      <style>body{font-family:Georgia,serif;line-height:1.6;padding:36px 48px;color:#111;font-size:11.5pt;} .content{white-space:pre-wrap;}</style>
      </head><body>${cabHeaderHtml}<div class="content">${esc(this.editedContent)}</div>${cabFooterHtml}</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 250);
  }

  isMissing(key: string): boolean {
    return (this.preview()?.missingVariables || []).includes(key);
  }

  insertVariable(token: string): void {
    this.newTemplate.content = (this.newTemplate.content || '') + token;
  }

  onDocxFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.newTemplate.nomFichier = file.name;
    this.newTemplate.format = 'DOCX_FILE';
    const reader = new FileReader();
    reader.onload = () => {
      this.newTemplate.fileData = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  }

  saveNewTemplate(): void {
    if (!this.newTemplate.titre.trim()) return;
    this.actService.saveTemplate(this.newTemplate).subscribe({
      next: (created) => {
        this.showNewTemplateModal.set(false);
        this.newTemplate = {
          titre: '', categorie: 'MISE_EN_DEMEURE', pays: this.selectedDossier?.paysJuridiction || 'FRANCE',
          description: '', format: 'TEXT_TEMPLATE', content: ''
        };
        this.selectedTemplateId = created.id!;
        this.loadTemplates();
        this.successMessage.set(`Modèle « ${created.titre} » ajouté à la bibliothèque.`);
      },
      error: () => this.errorMessage.set('Impossible d\'enregistrer le nouveau modèle.')
    });
  }
}
