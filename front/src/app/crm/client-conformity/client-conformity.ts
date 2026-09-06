import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Client, ClientStatus, Document, YenteMatchResponse, ScreeningExecutionDTO, ScreeningMatchDTO, ScreeningExecutionStatus, FormConfig, ClientDiligenceStatus } from '../../appTypes';

import { FormsModule } from '@angular/forms';
import { AlertService } from '../../services/alert-service';
import { ClientService } from '../../services/client-service';
import { NavigationService } from '../../services/navigation-service';
import { AmlService } from '../../services/aml-service';
import { ScreeningExecutionService } from '../../services/screening-execution.service';
import { ScreeningMatchService } from '../../services/screening-match.service';
import { FormConfigService } from '../../services/form-config-service';
import { ClientDiligenceStatusService } from '../../services/client-diligence-status-service';
import { DocumentService } from '../../services/document.service';

import { MatchAnalysisModal } from './match-analysis-modal';
import { AssignFormModalComponent } from '../../due-diligence/assign-form-modal/assign-form-modal.component';
import { DocumentDialog } from '../../document/document-dialog/document-dialog';

@Component({
  selector: 'app-client-conformity',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatchAnalysisModal, AssignFormModalComponent, DocumentDialog, TranslatePipe],
  templateUrl: './client-conformity.html',
  styleUrl: './client-conformity.css'
})
export class ClientConformity implements OnInit {

  clientService = inject(ClientService);
  screeningExecutionService = inject(ScreeningExecutionService);
  screeningMatchService = inject(ScreeningMatchService);
  formConfigService = inject(FormConfigService);
  diligenceStatusService = inject(ClientDiligenceStatusService);
  documentService = inject(DocumentService);

  client: Client | null = null;
  executions: ScreeningExecutionDTO[] = [];
  matches: ScreeningMatchDTO[] = [];
  matchDateFilter: string = '';
  matchStatusFilter: 'ALL' | 'PENDING' | 'FALSE_POSITIVE' | 'TRUE_POSITIVE' | 'DILIGENCE_REQUIRED' = 'ALL';
  searchQuery: string = '';

  showAssignFormModal = false;
  availableForms: FormConfig[] = [];

  get latestMatches(): ScreeningMatchDTO[] {
    const map = new Map<string, ScreeningMatchDTO>();
    for (const match of this.matches) {
      const key = match.yenteId ? `yente_${match.yenteId}` : `id_${match.id}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, match);
      } else {
        const existingTime = existing.createdAt ? new Date(existing.createdAt).getTime() : (existing.id || 0);
        const matchTime = match.createdAt ? new Date(match.createdAt).getTime() : (match.id || 0);
        if (matchTime >= existingTime || (match.id || 0) > (existing.id || 0)) {
          map.set(key, match);
        }
      }
    }
    return Array.from(map.values());
  }

  get pendingMatchesCount(): number {
    return this.latestMatches.filter(m => m.status === 'PENDING' || !m.status).length;
  }

  get falsePositivesCount(): number {
    return this.latestMatches.filter(m => m.status === 'FALSE_POSITIVE').length;
  }

  get truePositivesCount(): number {
    return this.latestMatches.filter(m => m.status === 'TRUE_POSITIVE' || m.status === 'TRUE_POSITIVE_SANCTION' || m.status === 'TRUE_POSITIVE_PEP').length;
  }

  get hasActiveSanction(): boolean {
    return this.latestMatches.some(m => m.status === 'TRUE_POSITIVE' || m.status === 'TRUE_POSITIVE_SANCTION');
  }

  get diligenceRequiredCount(): number {
    return this.latestMatches.filter(m => m.status === 'DILIGENCE_REQUIRED').length;
  }

  get isClientModifiedSinceLastReview(): boolean {
    if (!this.client || !this.client.version || this.client.version <= 1) return false;
    const currentVersion = this.client.version;
    return this.latestMatches.some(m => 
      m.status === 'FALSE_POSITIVE' && 
      (m.clientVersionAtReview || 1) < currentVersion
    );
  }

  get riskLevel(): { label: string; textClass: string; bgClass: string; borderClass: string; badgeClass: string } {
    const highestScore = this.getHighestMatchScore();
    const hasSanction = this.latestMatches.some(m => m.status === 'TRUE_POSITIVE' || m.status === 'TRUE_POSITIVE_SANCTION');
    const hasPep = this.latestMatches.some(m => m.status === 'TRUE_POSITIVE_PEP');

    if (hasSanction || highestScore >= 0.8 || this.client?.clientStatus === 'BLOCKED') {
      return {
        label: 'Risque Élevé / Sanction',
        textClass: 'text-rose-700',
        bgClass: 'bg-rose-50',
        borderClass: 'border-rose-200',
        badgeClass: 'bg-rose-500 text-white'
      };
    }
    if (hasPep || highestScore >= 0.5 || this.client?.clientStatus?.startsWith('INDULGENCE') || this.pendingMatchesCount > 0) {
      return {
        label: hasPep ? 'Vigilance Renforcée (PPE)' : (this.pendingMatchesCount > 0 ? 'Triage Requis' : 'Risque Modéré'),
        textClass: 'text-amber-700',
        bgClass: 'bg-amber-50',
        borderClass: 'border-amber-200',
        badgeClass: 'bg-amber-500 text-white'
      };
    }
    return {
      label: 'Conforme / Risque Faible',
      textClass: 'text-emerald-700',
      bgClass: 'bg-emerald-50',
      borderClass: 'border-emerald-200',
      badgeClass: 'bg-emerald-500 text-white'
    };
  }

  getFilteredMatches(): ScreeningMatchDTO[] {
    return this.latestMatches.filter(match => {
      // 1. Status filter
      if (this.matchStatusFilter === 'PENDING') {
        if (match.status && match.status !== 'PENDING') return false;
      } else if (this.matchStatusFilter === 'FALSE_POSITIVE') {
        if (match.status !== 'FALSE_POSITIVE') return false;
      } else if (this.matchStatusFilter === 'TRUE_POSITIVE') {
        if (match.status !== 'TRUE_POSITIVE' && match.status !== 'TRUE_POSITIVE_SANCTION' && match.status !== 'TRUE_POSITIVE_PEP') return false;
      } else if (this.matchStatusFilter === 'DILIGENCE_REQUIRED') {
        if (match.status !== 'DILIGENCE_REQUIRED') return false;
      }

      // 2. Date filter
      if (this.matchDateFilter) {
        if (!match.createdAt) return false;
        const dateObj = new Date(match.createdAt);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        if (dateStr > this.matchDateFilter) return false;
      }

      // 3. Search text
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase().trim();
        const target = (match.targetName || '').toLowerCase();
        const yenteId = (match.yenteId || '').toLowerCase();
        const uboName = (match.uboDTO?.fullName || '').toLowerCase();
        if (!target.includes(query) && !yenteId.includes(query) && !uboName.includes(query)) return false;
      }

      return true;
    });
  }

  isLoading = true;
  isVerifying = false;
  selectedMatch: ScreeningMatchDTO | null = null;
  isAnalysisModalOpen = false;
  showAddDocumentDialog = false;
  downloadingPdf = false;
  downloadingFatfPdf = false;
  showReportModal = false;
  reportStartDate: string = '';
  reportEndDate: string = '';
  matchesCurrentPage = 1;
  matchesItemsPerPage = 5;

  get paginatedMatches() {
    const filtered = this.getFilteredMatches();
    const startIndex = (this.matchesCurrentPage - 1) * this.matchesItemsPerPage;
    return filtered.slice(startIndex, startIndex + this.matchesItemsPerPage);
  }
  
  get totalMatchesPages() {
    return Math.ceil(this.getFilteredMatches().length / this.matchesItemsPerPage);
  }

  executionsCurrentPage = 1;
  executionsItemsPerPage = 5;

  get paginatedExecutions() {
    const startIndex = (this.executionsCurrentPage - 1) * this.executionsItemsPerPage;
    return this.executions.slice(startIndex, startIndex + this.executionsItemsPerPage);
  }

  get totalExecutionsPages() {
    return Math.ceil(this.executions.length / this.executionsItemsPerPage);
  }

  getDisplayName(client: any): string {
    if (!client) return '';
    return `${client.nom || client.nomCommercial || ''} ${client.prenom || ''}`.trim();
  }

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly navigationService = inject(NavigationService);
  private readonly alertService = inject(AlertService);
  private readonly amlService = inject(AmlService);

  openAnalysisModal(match: ScreeningMatchDTO) {
    this.selectedMatch = match;
    this.isAnalysisModalOpen = true;
  }

  closeAnalysisModal() {
    this.selectedMatch = null;
    this.isAnalysisModalOpen = false;
  }

  getClientRegistration(client: any): string {
    if (!client) return '';
    return client.numeroRegistreCommerce || client.numeroIdFiscal || client.cin || client.numeroRegistreNational || '';
  }

  getClientCountry(client: any): string {
    if (!client) return 'International';
    const nat = client.nationalite || client.nationaliteRepresentantLegal;
    const pays = client.paysResidance || client.pays;
    if (nat && pays && nat.toLowerCase() !== pays.toLowerCase()) {
      return `${nat} (${pays})`;
    }
    return nat || pays || 'International';
  }

  getMatchStatusBadge(status?: string): { label: string; class: string } {
    switch (status) {
      case 'FALSE_POSITIVE':
        return { label: 'Faux Positif (Écarté)', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'TRUE_POSITIVE_SANCTION':
      case 'TRUE_POSITIVE':
        return { label: 'Vrai Positif (Sanction)', class: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'TRUE_POSITIVE_PEP':
        return { label: 'Vrai Positif (PPE)', class: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'DILIGENCE_REQUIRED':
        return { label: 'Diligence Requise', class: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'PENDING':
      default:
        return { label: 'En attente d\'analyse', class: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  }

  getOfficialProviderForMatch(match: ScreeningMatchDTO | any): { name: string; url?: string; badgeClass: string } {
    const yenteId = (match?.yenteId || match?.id || '').toLowerCase();
    
    // Check rawResponse datasets if available
    const datasets: string[] = [];
    if (match?.rawResponse) {
      let parsed = match.rawResponse;
      if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch {}
      }
      const responses = parsed?.responses;
      if (responses) {
        for (const key of Object.keys(responses)) {
          const results = responses[key]?.results;
          if (Array.isArray(results)) {
            const found = results.find((r: any) => r.id === (match.yenteId || match.id));
            if (found?.datasets) datasets.push(...found.datasets.map((d: any) => String(d).toLowerCase()));
          }
        }
      }
    }

    if (datasets.some(d => d.includes('fr_tresor') || d.includes('tresor') || d.includes('gel')) || yenteId.startsWith('fr-')) {
      return { name: 'DG Trésor 🇫🇷', url: 'https://gels-avoirs.dgtresor.gouv.fr/', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' };
    }
    if (datasets.some(d => d.includes('ofac') || d.includes('sdn')) || yenteId.startsWith('ofac-')) {
      return { name: 'OFAC 🇺🇸', url: 'https://sanctionssearch.ofac.treas.gov/', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' };
    }
    if (datasets.some(d => d.includes('eu_fsf') || d.includes('eu_')) || yenteId.startsWith('eu-')) {
      return { name: 'UE Sanctions 🇪🇺', url: 'https://www.sanctionsmap.eu/', badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' };
    }
    if (datasets.some(d => d.includes('un_sc') || d.includes('un_') || d.includes('unsc')) || yenteId.startsWith('un-')) {
      return { name: 'ONU 🇺🇳', url: 'https://www.un.org/securitycouncil/content/un-sc-consolidated-list', badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100' };
    }
    if (datasets.some(d => d.includes('seco') || d.includes('ch_')) || yenteId.startsWith('ch-')) {
      return { name: 'SECO 🇨🇭', url: 'https://www.seco.admin.ch/seco/fr/home/Aussenwirtschaftspolitik_Wirtschaftliche_Zusammenarbeit/Wirtschaftsbeziehungen/exportkontrollen-und-sanktionen/sanktionen-embargos.html', badgeClass: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' };
    }
    if (datasets.some(d => d.includes('gb_hmt') || d.includes('ofsi')) || yenteId.startsWith('gb-')) {
      return { name: 'UK OFSI 🇬🇧', url: 'https://www.gov.uk/government/publications/financial-sanctions-consolidated-list-of-targets', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' };
    }
    if (datasets.some(d => d.includes('au_dfat') || d.includes('dfat')) || yenteId.startsWith('au-') || yenteId.startsWith('dfat-')) {
      return { name: 'DFAT 🇦🇺', url: 'https://www.dfat.gov.au/international-relations/security/sanctions/consolidated-list', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' };
    }
    if (datasets.some(d => d.includes('interpol')) || yenteId.startsWith('interpol-')) {
      return { name: 'Interpol 🌐', url: 'https://www.interpol.int/How-we-work/Notices/Red-Notices', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' };
    }

    return { name: 'Registre Réglementaire 🛡️', badgeClass: 'bg-slate-50 text-slate-700 border-slate-200' };
  }

  async dismissAllAsFalsePositive() {
    const pendingMatches = this.latestMatches.filter(m => m.status === 'PENDING' || !m.status);
    if (pendingMatches.length === 0) {
      this.alertService.displayMessage('Information', 'Aucune correspondance en attente à traiter.', 'info');
      return;
    }

    const confirmed = await this.alertService.confirmMessage(
      'Validation collective des correspondances',
      `Voulez-vous classer les ${pendingMatches.length} correspondance(s) en attente comme "Faux Positifs" (Homonymie vérifiée) ? Le statut AML du client sera automatiquement recalculé.`,
      'question'
    );

    if (confirmed && this.client?.id) {
      const matchIds = pendingMatches.map(m => m.id!).filter(Boolean);
      this.screeningMatchService.processBatchDecision(
        matchIds,
        'FALSE_POSITIVE',
        'Validation collective : Homonymies écartées après revue documentaire.',
        'Avocat Référent LCB-FT'
      ).subscribe({
        next: () => {
          this.alertService.success(`${matchIds.length} correspondance(s) classée(s) comme Faux Positif(s).`);
          this.loadClient(String(this.client!.id));
        },
        error: (err) => {
          console.error(err);
          this.alertService.displayMessage('Erreur', 'Échec du traitement par lot.', 'error');
        }
      });
    }
  }

  onDecisionMade(updatedMatch: ScreeningMatchDTO) {
    if (this.client && this.client.id) {
      const clientId = String(this.client.id);
      
      // If decision requires diligence, trigger the workflow
      if (updatedMatch.status === 'DILIGENCE_REQUIRED') {
        this.clientService.updateClientStatus(this.client.id!, ClientStatus.INDULGENCE_REQUIRED).subscribe({
          next: (updatedClient) => {
            this.client = updatedClient;
            this.startDueDiligence();
          }
        });
      }

      this.loadAmlHistory(clientId);
      this.loadClient(clientId);
    }
    this.closeAnalysisModal();
  }

  openAddDocumentDialog() {
    this.showAddDocumentDialog = true;
  }

  closeAddDocumentDialog() {
    this.showAddDocumentDialog = false;
  }

  onAddDocument(doc: Document) {
    if (this.client && this.client.id) {
      if (doc.file) {
        this.fileToBase64(doc.file).then(base64 => {
          const docDto: Document = {
            ...doc,
            fileData: base64,
            clientId: this.client!.id,
            nomFichier: doc.name || doc.nomFichier || 'document.pdf'
          };

          this.documentService.create(docDto).subscribe({
            next: (savedDoc: Document) => {
              if (!this.client!.documents) this.client!.documents = [];
              this.client!.documents.push(savedDoc);
              this.alertService.success('Document ajouté avec succès');
              this.closeAddDocumentDialog();
            },
            error: (err: any) => {
              console.error('Error creating document:', err);
              this.alertService.displayMessage('Erreur', 'Erreur lors de l\'ajout du document', 'error');
            }
          });
        });
      } else {
        doc.clientId = this.client.id;
        this.documentService.create(doc).subscribe({
          next: (savedDoc: Document) => {
            if (!this.client!.documents) this.client!.documents = [];
            this.client!.documents.push(savedDoc);
            this.alertService.success('Document ajouté avec succès');
            this.closeAddDocumentDialog();
          },
          error: (err: any) => {
            this.alertService.displayMessage('Erreur', 'Erreur lors de l\'ajout du document', 'error');
          }
        });
      }
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:application/pdf;base64,
      };
      reader.onerror = error => reject(error);
    });
  }

  isAmlLoading = false;

  // Expose ClientStatus enum for the template
  public ClientStatus = ClientStatus;
  // Get all values from the enum
  public clientStatuses = Object.values(ClientStatus);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadClient(id);
      } else {
        this.isLoading = false;
      }
    });
  }

  private loadClient(id: string) {
    this.clientService.findById(id).subscribe(client => {
      this.client = client;
      this.loadAmlHistory(id);
    });
  }

  loadAmlHistory(clientId: string) {
    this.screeningExecutionService.getByClientId(clientId).subscribe(res => {
      this.executions = res.content || [];
    });
    this.screeningMatchService.getByClientId(clientId).subscribe(res => {
      this.matches = res.content || [];
    });
  }



  isFile(value: string): boolean {
    if (!value) return false; // Ensure value is not null/undefined
    const extensions = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.csv'];
    return extensions.some(ext => value.toLowerCase().endsWith(ext));
  }

  startDueDiligence() {
    if (this.client?.id) {
      this.navigationService.navigateToClientDiligenceResults(String(this.client.id));
    }
  }

  assignForm(event: { formId: string; uboId?: number }) {
    if (!event.formId || !this.client) return;

    const assignment: ClientDiligenceStatus = {
      clientId: this.client.id!,
      formConfigId: event.formId,
      uboId: event.uboId,
      status: 'PENDING',
      enabled: true
    };

    this.diligenceStatusService.create(assignment).subscribe({
      next: () => {
        this.alertService.displayMessage('Succès', 'Formulaire assigné avec succès.', 'success');
        this.showAssignFormModal = false;
        // Trigger AML check after assignment if that was the intent, or just stay here
        // this.verifyAml(); 
      },
      error: (err) => {
        this.alertService.displayMessage('Erreur', 'L\'assignation a échoué.', 'error');
      }
    });
  }

  editClient() {
    console.log('Edit client', this.client?.id);
    this.navigationService.navigateToClientEdit(String(this.client?.id));
  }

  downloadDocument(doc: Document) {
    if (!doc.id) {
      this.alertService.displayMessage('Attention', 'Document sans ID, impossible de télécharger.', 'warning');
      return;
    }

    this.documentService.findById(doc.id).subscribe({
      next: (fullDoc) => {
        if (fullDoc.fileData) {
          try {
            const byteCharacters = atob(fullDoc.fileData);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: fullDoc.typeDocument || 'application/octet-stream' });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fullDoc.nomFichier || fullDoc.name || 'document';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } catch (e) {
            console.error('Error decoding file data', e);
            this.alertService.displayMessage('Erreur', 'Données de fichier corrompues.', 'error');
          }
        } else {
          this.alertService.displayMessage('Erreur', 'Le contenu du fichier est vide ou non disponible.', 'error');
        }
      },
      error: (err) => {
        console.error('Error downloading document', err);
        this.alertService.displayMessage('Erreur', 'Impossible de récupérer le document depuis le serveur.', 'error');
      }
    });
  }

  scrollToMatches(): void {
    const el = document.getElementById('matches-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async onStatusChange(newStatus: string) {
    if (!this.client) return;

    const previousStatus = this.client.clientStatus;

    // 1. Contrôle préalable : Vérifier si des alertes sont en attente d'analyse (PENDING)
    if (this.pendingMatchesCount > 0 && (newStatus === 'AML_VALIDATED' || newStatus === 'VALIDATED')) {
      this.alertService.displayMessage(
        'Triage des alertes obligatoire',
        `Impossible de valider la conformité du client : il reste ${this.pendingMatchesCount} alerte(s) en attente d'analyse (PENDING). Vous devez d'abord qualifier chaque correspondance (Faux Positif, PPE, Sanction...) avant de valider le dossier.`,
        'warning'
      );
      this.client.clientStatus = previousStatus;
      this.scrollToMatches();
      return;
    }

    // 2. Contrôle préalable : Vérifier si une sanction est active et confirmée
    if (this.hasActiveSanction && (newStatus === 'AML_VALIDATED' || newStatus === 'VALIDATED')) {
      this.alertService.displayMessage(
        'Action bloquée (Sanction Confirmée)',
        'Ce client fait l\'objet d\'une alerte confirmée sur liste de sanctions internationales. Son statut ne peut pas être passé à Validé / Conforme.',
        'error'
      );
      this.client.clientStatus = previousStatus;
      return;
    }

    const confirmed = await this.alertService.confirmMessage(
      'Confirmation de changement de statut',
      `Êtes-vous sûr de vouloir changer le statut du client de "${previousStatus}" vers "${newStatus}" ?`,
      'warning'
    );

    if (confirmed) {
      this.clientService.updateClientStatus(this.client.id!, newStatus as ClientStatus).subscribe({
        next: (updatedClient) => {
          this.client = updatedClient;
          this.alertService.success('Statut du client mis à jour avec succès');
        },
        error: (err) => {
          console.error('Error updating status', err);
          const errorMsg = err?.error?.message || err?.error?.detail || err?.message || 'Impossible de mettre à jour le statut.';
          this.alertService.displayMessage('Erreur de conformité', errorMsg, 'error');
          if (this.client) this.client.clientStatus = previousStatus;
        }
      });
    } else {
      this.client.clientStatus = previousStatus;
    }
  }

  async verifyAml() {
    if (!this.client) return;

    const c = this.client as any;
    const searchName = this.client.type === 'SOCIETE' || this.client.type === 'INSTITUTION' ? 
      (c.nomCommercial || c.nom) : 
      `${c.nom || ''} ${c.prenom || ''}`.trim();

    if (!searchName) {
      this.alertService.displayMessage('Erreur', 'Le nom du client est manquant pour lancer l\'analyse.', 'error');
      return;
    }

    this.isAmlLoading = true;

    this.amlService.verifyClient(searchName).subscribe({
      next: (res) => {
        this.isAmlLoading = false;

        let matchResponse: YenteMatchResponse;
        if (typeof res === 'string') {
          try {
            matchResponse = JSON.parse(res);
          } catch {
            this.alertService.displayMessage('Erreur', 'Format de réponse invalide depuis Yente.', 'error');
            return;
          }
        } else {
          matchResponse = res;
        }

        const q1Results = matchResponse.responses?.['q1']?.results || [];

        if (q1Results.length === 0) {
          this.client!.clientStatus = ClientStatus.AML_VALIDATED;
        } else {
          const topResult = q1Results.sort((a: any, b: any) => b.score - a.score)[0];
          
          if (topResult.score >= 0.8 || topResult.match || topResult.target) {
            this.client!.clientStatus = ClientStatus.BLOCKED;
          } else if (topResult.score >= 0.5) {
            this.client!.clientStatus = ClientStatus.VERIFICATION_AML_REQUIRED;
          } else {
            this.client!.clientStatus = ClientStatus.AML_VALIDATED;
          }
        }

        const targetStatus = this.client!.clientStatus || ClientStatus.AML_REQUIRED;
        this.clientService.updateClientStatus(this.client!.id!, targetStatus).subscribe({
          next: (updatedClient) => {
            this.client = updatedClient;
            this.alertService.success('Analyse AML terminée et dossier mis à jour.');
            this.loadAmlHistory(String(this.client!.id)); // Reload matches and executions after update
          },
          error: (err) => {
            console.error('Save error', err);
            this.alertService.displayMessage('Attention', 'Résultat calculé mais échec de la sauvegarde.', 'error');
          }
        });
      },
      error: (err) => {
        this.isAmlLoading = false;
        console.error(err);
        this.alertService.displayMessage('Erreur', 'Impossible de contacter le service Yente.', 'error');
      }
    });
  }

  triggerClientVerification() {
    if (!this.client || !this.client.id) return;
    this.isVerifying = true;
    this.screeningExecutionService.triggerClient(this.client.id).subscribe({
      next: (result) => {
        this.isVerifying = false;
        this.alertService.success('Vérification AML terminée pour le client.');
        this.loadClient(String(this.client!.id));
      },
      error: (err) => {
        this.isVerifying = false;
        console.error(err);
        this.alertService.displayMessage('Erreur', 'Erreur lors de la vérification AML du client.', 'error');
      }
    });
  }

  getResultsFromRawResponse(rawResponse: any): any[] {
    if (!rawResponse) return [];
    
    let parsed = rawResponse;
    if (typeof rawResponse === 'string') {
      try {
        parsed = JSON.parse(rawResponse);
      } catch {
        return [];
      }
    }
    
    // Yente structure: { responses: { "q1": { results: [...] } } }
    const responses = parsed.responses;
    if (!responses) return [];
    
    const queryKey = Object.keys(responses)[0]; // get the first query key (e.g. 'q1' or 'query-1')
    if (queryKey && responses[queryKey] && Array.isArray(responses[queryKey].results)) {
      return responses[queryKey].results;
    }
    
    return [];
  }

  getTargetName(match: ScreeningMatchDTO): string {
    if (match.targetName) return match.targetName;
    
    const raw = match.rawResponse;
    if (!raw) return 'Cible non identifiée';
    
    const results = this.getResultsFromRawResponse(raw);
    const targetEntity = results.find((r: any) => r.id === match.yenteId) || results[0];
    
    if (targetEntity) {
      return targetEntity.caption || targetEntity.name || targetEntity.properties?.name?.[0] || 'Entité ' + match.yenteId;
    }
    
    return 'Entité ' + (match.yenteId || 'Inconnue');
  }

  getHighestMatchScore(): number {
    if (!this.latestMatches || this.latestMatches.length === 0) return 0;
    return Math.max(...this.latestMatches.map(m => m.score || 0));
  }

  getTopics(reasonString?: string): { label: string, description: string, colorClass: string }[] {
    if (!reasonString) return [];
    const topics = reasonString.split(',').map(t => t.trim().toLowerCase());
    return topics.map(topic => {
      switch (topic) {
        case 'role.pep': return { label: 'PEP', description: 'Personne Politiquement Exposée', colorClass: 'bg-amber-100 text-amber-800' };
        case 'role.rca': return { label: 'RCA', description: 'Proche ou Associé d\'une PEP', colorClass: 'bg-amber-100 text-amber-800' };
        case 'sanction': return { label: 'SANCTION', description: 'Fait l\'objet de sanctions internationales', colorClass: 'bg-rose-100 text-rose-800' };
        case 'crime.terror': return { label: 'TERRORISME', description: 'Liens avec le terrorisme', colorClass: 'bg-rose-100 text-rose-800' };
        case 'crime.fin': return { label: 'FINANCE', description: 'Criminalité financière', colorClass: 'bg-rose-100 text-rose-800' };
        case 'crime': return { label: 'CRIME', description: 'Antécédents criminels', colorClass: 'bg-rose-100 text-rose-800' };
        case 'poi': return { label: 'POI', description: 'Personne d\'intérêt', colorClass: 'bg-indigo-100 text-indigo-800' };
        case 'corp.disqual': return { label: 'DISQUALIFIÉ', description: 'Interdiction de gérer une société', colorClass: 'bg-orange-100 text-orange-800' };
        case 'wanted': return { label: 'RECHERCHÉ', description: 'Avis de recherche', colorClass: 'bg-rose-100 text-rose-800' };
        default: return { label: topic.toUpperCase(), description: 'Catégorie signalée', colorClass: 'bg-slate-100 text-slate-800' };
      }
    });
  }

  downloadKycAuditPdf() {
    if (!this.client || !this.client.id) return;
    this.downloadingPdf = true;
    this.alertService.displayMessage('Génération en cours', 'Préparation de la Fiche de Vigilance KYC en cours...', 'info');
    
    this.clientService.generateClientKycAuditReportPdf(this.client.id, this.reportStartDate, this.reportEndDate).subscribe({
        next: (blob) => {
            this.downloadingPdf = false;
            this.closeReportModal();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Fiche_Vigilance_KYC_${this.getDisplayName(this.client).replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            this.alertService.success('Fiche de Vigilance LCB-FT (PDF) téléchargée avec succès.');
        },
        error: (err) => {
            console.error('Error generating KYC audit PDF', err);
            this.downloadingPdf = false;
            this.closeReportModal();
            this.alertService.displayMessage('Erreur', 'Impossible de générer la Fiche de Vigilance KYC. Veuillez réessayer plus tard.', 'error');
        }
    });
  }

  downloadFatfAuditPdf() {
    if (!this.client || !this.client.id) return;
    this.downloadingFatfPdf = true;
    this.alertService.displayMessage('Génération en cours', 'Préparation du Dossier d\'Audit de Conformité GAFI (FATF)...', 'info');
    
    this.clientService.generateClientFatfAuditReportPdf(this.client.id, this.reportStartDate, this.reportEndDate).subscribe({
        next: (blob) => {
            this.downloadingFatfPdf = false;
            this.closeReportModal();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Rapport_Conformite_GAFI_FATF_${this.getDisplayName(this.client).replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            this.alertService.success('Rapport d\'Audit GAFI / FATF (PDF) téléchargé avec succès.');
        },
        error: (err) => {
            console.error('Error generating FATF audit PDF', err);
            this.downloadingFatfPdf = false;
            this.closeReportModal();
            this.alertService.displayMessage('Erreur', 'Impossible de générer le Rapport d\'Audit GAFI (FATF). Veuillez réessayer plus tard.', 'error');
        }
    });
  }

  openReportModal() {
    this.showReportModal = true;
  }

  closeReportModal() {
    this.showReportModal = false;
    this.reportStartDate = '';
    this.reportEndDate = '';
  }
}


