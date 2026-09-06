import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScreeningMatchDTO, ScreeningMatchStatus, Client } from '../../appTypes';
import { ScreeningMatchService } from '../../services/screening-match.service';
import { AlertService } from '../../services/alert-service';

export interface QuickReason {
  code: string;
  label: string;
  category: 'FALSE_POSITIVE' | 'PEP' | 'DILIGENCE' | 'SANCTION';
  defaultText: string;
}

export interface TopicInfo {
  label: string;
  description: string;
  badgeClass: string;
}

export interface OfficialProviderInfo {
  code: string;
  name: string;
  authority: string;
  countryOrOrg: string;
  url: string;
  badgeClass: string;
}

@Component({
  selector: 'app-match-analysis-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './match-analysis-modal.html',
  styleUrl: './match-analysis-modal.css'
})
export class MatchAnalysisModal {
  @Input() match!: ScreeningMatchDTO;
  @Input() client!: any;
  @Output() close = new EventEmitter<void>();
  @Output() decisionMade = new EventEmitter<ScreeningMatchDTO>();

  private readonly matchService = inject(ScreeningMatchService);
  private readonly alertService = inject(AlertService);

  comment: string = '';
  selectedReasonCode: string = '';
  isProcessing: boolean = false;
  activeTab: 'summary' | 'sanctions' | 'aliases' | 'raw' = 'summary';

  readonly quickReasons: QuickReason[] = [
    {
      code: 'DOB_MISMATCH',
      label: 'Date de naissance différente',
      category: 'FALSE_POSITIVE',
      defaultText: 'Date de naissance différente entre le client et la personne sanctionnée (Homonymie évidente).'
    },
    {
      code: 'COUNTRY_MISMATCH',
      label: 'Nationalité / Pays distincts',
      category: 'FALSE_POSITIVE',
      defaultText: 'Nationalité et pays de résidence formellement distincts de la cible sous surveillance.'
    },
    {
      code: 'LEGAL_ENTITY_DISTINCT',
      label: 'Société distincte (SIREN/RC différent)',
      category: 'FALSE_POSITIVE',
      defaultText: 'Entité morale distincte avec numéro d\'immatriculation et juridiction différents.'
    },
    {
      code: 'HOMONYM_VERIFIED',
      label: 'Homonymie vérifiée sur pièce d\'identité',
      category: 'FALSE_POSITIVE',
      defaultText: 'Homonymie simple vérifiée et écartée après contrôle des pièces justificatives officielles (Passeport / CIN).'
    },
    {
      code: 'PEP_CONFIRMED',
      label: 'PPE / Élu / Haut fonctionnaire confirmé',
      category: 'PEP',
      defaultText: 'Personne Politiquement Exposée (PPE) confirmée. Entrée en relation soumise à Vigilance Renforcée et validation Gérant.'
    },
    {
      code: 'MISSING_DOCS',
      label: 'Pièces d\'identité / Kbis à réclamer',
      category: 'DILIGENCE',
      defaultText: 'Doute persistant en raison d\'informations incomplètes. Justificatifs d\'identité complémentaires requis.'
    },
    {
      code: 'SANCTION_CONFIRMED',
      label: 'Sanction / Gel des avoirs confirmé',
      category: 'SANCTION',
      defaultText: 'Correspondance avérée avec une liste de sanctions internationales ou de gel des avoirs. Blocage immédiat requis.'
    }
  ];

  private get rawParsed(): any {
    if (!this.match?.rawResponse) return null;
    if (typeof this.match.rawResponse === 'string') {
      try {
        return JSON.parse(this.match.rawResponse);
      } catch {
        return null;
      }
    }
    return this.match.rawResponse;
  }

  get yenteResult(): any {
    const raw = this.rawParsed;
    if (!raw?.responses) return null;
    
    // Search across all query responses (e.g. 'query-1', 'q1', etc.)
    for (const key of Object.keys(raw.responses)) {
      const results = raw.responses[key]?.results;
      if (Array.isArray(results)) {
        const found = results.find((r: any) => r.id === this.match.yenteId);
        if (found) return found;
      }
    }
    
    // Fallback: check first available result
    const firstKey = Object.keys(raw.responses)[0];
    if (firstKey && raw.responses[firstKey]?.results?.length > 0) {
      return raw.responses[firstKey].results[0];
    }
    return null;
  }

  get yenteProperties(): Record<string, any[]> {
    return this.yenteResult?.properties || {};
  }

  get yenteMeta() {
     const result = this.yenteResult;
     return {
        score: result?.score ?? this.match.score ?? 0,
        datasets: (result?.datasets as string[]) || [],
        schema: result?.schema || 'Person',
        lastChange: result?.last_change,
        firstSeen: result?.first_seen,
        lastSeen: result?.last_seen,
        caption: result?.caption || this.match.targetName || 'Cible Sanctionnée'
     };
  }

  get clientDob(): string {
    if (!this.client) return 'Non renseignée';
    const dob = this.client.dateNaissance || this.client.dateNaissanceRepresentantLegal;
    if (!dob) return 'Non renseignée';
    try {
      const d = new Date(dob);
      return isNaN(d.getTime()) ? String(dob) : d.toLocaleDateString('fr-FR');
    } catch {
      return String(dob);
    }
  }

  get yenteDob(): string {
    const dobs = this.yenteProperties['birthDate'];
    if (dobs && dobs.length > 0) return dobs.join(', ');
    return 'Non renseignée dans la fiche sanction';
  }

  get clientCountry(): string {
    if (!this.client) return 'Non renseigné';
    const nat = this.client.nationalite || this.client.nationaliteRepresentantLegal;
    const pays = this.client.pays || this.client.paysResidance;
    if (nat && pays && nat.toLowerCase() !== pays.toLowerCase()) {
      return `${nat} (Résidence : ${pays})`;
    }
    return nat || pays || 'Non renseigné';
  }

  get yenteCountry(): string {
    const nats = this.yenteProperties['nationality'] 
      || this.yenteProperties['country'] 
      || this.yenteProperties['citizenship']
      || this.yenteProperties['jurisdiction'];
    if (nats && nats.length > 0) return nats.join(', ');
    const birthPlace = this.yenteProperties['birthPlace'];
    if (birthPlace && birthPlace.length > 0) return birthPlace.join(', ');
    return 'Inconnu';
  }

  get isDobMismatch(): boolean {
    const cDob = this.clientDob;
    const yDob = this.yenteDob;
    return cDob !== 'Non renseignée' && yDob !== 'Non renseignée dans la fiche sanction' && !yDob.includes(cDob);
  }

  get isCountryMismatch(): boolean {
    const cCountry = this.clientCountry;
    const yCountry = this.yenteCountry;
    if (cCountry === 'Non renseigné' || yCountry === 'Inconnu') return false;
    const nat = (this.client?.nationalite || this.client?.nationaliteRepresentantLegal || '').toLowerCase();
    const pays = (this.client?.pays || this.client?.paysResidance || '').toLowerCase();
    const yLower = yCountry.toLowerCase();
    
    const natMatch = nat && (yLower.includes(nat) || (nat === 'russe' && (yLower.includes('russi') || yLower.includes('ru'))));
    const paysMatch = pays && (yLower.includes(pays) || (pays === 'luxembourg' && yLower.includes('lu')));
    
    return !natMatch && !paysMatch;
  }

  get sanctionReasons(): string[] {
    const reasons: string[] = [];
    const props = this.yenteProperties;
    
    if (props['notes']) reasons.push(...props['notes']);
    if (props['reason']) reasons.push(...props['reason']);
    if (props['summary']) reasons.push(...props['summary']);
    if (props['description']) reasons.push(...props['description']);
    if (this.match.matchReason && !reasons.includes(this.match.matchReason)) {
      reasons.unshift(this.match.matchReason);
    }
    return Array.from(new Set(reasons.filter(Boolean)));
  }

  get sanctionPrograms(): string[] {
    const programs: string[] = [];
    const props = this.yenteProperties;
    if (props['program']) programs.push(...props['program']);
    if (props['authority']) programs.push(...props['authority']);
    if (props['legalBasis']) programs.push(...props['legalBasis']);
    return Array.from(new Set(programs.filter(Boolean)));
  }

  get sanctionDates(): { startDate?: string; endDate?: string; listingDate?: string; duration?: string } {
    const props = this.yenteProperties;
    return {
      startDate: props['startDate']?.[0],
      endDate: props['endDate']?.[0],
      listingDate: props['listingDate']?.[0] || this.yenteMeta.firstSeen,
      duration: props['duration']?.[0]
    };
  }

  get aliases(): string[] {
    const aliases: string[] = [];
    const props = this.yenteProperties;
    if (props['alias']) aliases.push(...props['alias']);
    if (props['weakAlias']) aliases.push(...props['weakAlias']);
    if (props['previousName']) aliases.push(...props['previousName']);
    if (props['name']) {
      props['name'].forEach((n: string) => {
        if (n !== this.match.targetName && !aliases.includes(n)) aliases.push(n);
      });
    }
    return Array.from(new Set(aliases.filter(Boolean)));
  }

  get idNumbers(): { type: string; value: string }[] {
    const ids: { type: string; value: string }[] = [];
    const props = this.yenteProperties;
    
    if (props['passportNumber']) {
      props['passportNumber'].forEach((v: string) => ids.push({ type: 'Passeport', value: v }));
    }
    if (props['idNumber']) {
      props['idNumber'].forEach((v: string) => ids.push({ type: 'Numéro d\'Identité (CIN)', value: v }));
    }
    if (props['taxNumber']) {
      props['taxNumber'].forEach((v: string) => ids.push({ type: 'Numéro Fiscal (NIF)', value: v }));
    }
    if (props['registrationNumber']) {
      props['registrationNumber'].forEach((v: string) => ids.push({ type: 'Registre Commerce / SIREN', value: v }));
    }
    if (props['innCode']) {
      props['innCode'].forEach((v: string) => ids.push({ type: 'Code INN', value: v }));
    }
    return ids;
  }

  get positions(): string[] {
    const props = this.yenteProperties;
    return props['position'] || [];
  }

  get addresses(): string[] {
    const props = this.yenteProperties;
    const addrs: string[] = [];
    if (props['address']) addrs.push(...props['address']);
    if (props['city']) addrs.push(...props['city']);
    return Array.from(new Set(addrs.filter(Boolean)));
  }

  get sourceUrls(): string[] {
    const props = this.yenteProperties;
    const urls: string[] = [];
    if (props['sourceUrl']) urls.push(...props['sourceUrl']);
    if (props['website']) urls.push(...props['website']);
    return Array.from(new Set(urls.filter(Boolean)));
  }

  get officialProviders(): OfficialProviderInfo[] {
    const providers: OfficialProviderInfo[] = [];
    const datasets = (this.yenteMeta.datasets || []).map(d => d.toLowerCase());
    const yenteId = (this.match?.yenteId || '').toLowerCase();
    const programs = (this.sanctionPrograms || []).join(' ').toLowerCase();

    // 1. DG Trésor / France
    if (datasets.some(d => d.includes('fr_tresor') || d.includes('tresor') || d.includes('gel')) || yenteId.startsWith('fr-') || programs.includes('trésor') || programs.includes('gel')) {
      providers.push({
        code: 'FR_DGTRESOR',
        name: 'DG Trésor (France)',
        authority: 'Ministère de l\'Économie et des Finances (Registre des Gels d\'Avoirs)',
        countryOrOrg: 'France 🇫🇷',
        url: 'https://gels-avoirs.dgtresor.gouv.fr/',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200'
      });
    }

    // 2. US OFAC (Office of Foreign Assets Control)
    if (datasets.some(d => d.includes('ofac') || d.includes('sdn')) || yenteId.startsWith('ofac-') || programs.includes('ofac') || programs.includes('sdn')) {
      providers.push({
        code: 'US_OFAC',
        name: 'OFAC (SDN List)',
        authority: 'U.S. Department of the Treasury',
        countryOrOrg: 'États-Unis 🇺🇸',
        url: 'https://sanctionssearch.ofac.treas.gov/',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200'
      });
    }

    // 3. Union Européenne (EU FSF / EEAS)
    if (datasets.some(d => d.includes('eu_fsf') || d.includes('eu_') || d.includes('european')) || yenteId.startsWith('eu-') || programs.includes('european union') || programs.includes('union européenne')) {
      providers.push({
        code: 'EU_FSF',
        name: 'Union Européenne (EU Sanctions)',
        authority: 'Commission Européenne & SEAE (Financial Sanctions)',
        countryOrOrg: 'Union Européenne 🇪🇺',
        url: 'https://www.sanctionsmap.eu/',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-200'
      });
    }

    // 4. ONU / UN Security Council
    if (datasets.some(d => d.includes('un_sc') || d.includes('un_') || d.includes('unsc')) || yenteId.startsWith('un-') || programs.includes('united nations') || programs.includes('nations unies')) {
      providers.push({
        code: 'UN_SC',
        name: 'Nations Unies (CSNU)',
        authority: 'Conseil de Sécurité des Nations Unies (Consolidated List)',
        countryOrOrg: 'ONU 🇺🇳',
        url: 'https://www.un.org/securitycouncil/content/un-sc-consolidated-list',
        badgeClass: 'bg-sky-100 text-sky-800 border-sky-200'
      });
    }

    // 5. SECO (Suisse)
    if (datasets.some(d => d.includes('seco') || d.includes('ch_')) || yenteId.startsWith('ch-') || programs.includes('seco') || programs.includes('suisse')) {
      providers.push({
        code: 'CH_SECO',
        name: 'SECO (Suisse)',
        authority: 'Secrétariat d\'État à l\'économie - Confédération Suisse',
        countryOrOrg: 'Suisse 🇨🇭',
        url: 'https://www.seco.admin.ch/seco/fr/home/Aussenwirtschaftspolitik_Wirtschaftliche_Zusammenarbeit/Wirtschaftsbeziehungen/exportkontrollen-und-sanktionen/sanktionen-embargos.html',
        badgeClass: 'bg-red-100 text-red-800 border-red-200'
      });
    }

    // 6. UK OFSI / HM Treasury
    if (datasets.some(d => d.includes('gb_hmt') || d.includes('ofsi') || d.includes('gb_')) || yenteId.startsWith('gb-') || programs.includes('ofsi') || programs.includes('hm treasury')) {
      providers.push({
        code: 'UK_OFSI',
        name: 'UK OFSI (HM Treasury)',
        authority: 'Office of Financial Sanctions Implementation - United Kingdom',
        countryOrOrg: 'Royaume-Uni 🇬🇧',
        url: 'https://www.gov.uk/government/publications/financial-sanctions-consolidated-list-of-targets',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-200'
      });
    }

    // 7. Interpol
    if (datasets.some(d => d.includes('interpol')) || yenteId.startsWith('interpol-') || programs.includes('interpol')) {
      providers.push({
        code: 'INTERPOL',
        name: 'Interpol (Notices Rouges)',
        authority: 'Organisation Internationale de Police Criminelle',
        countryOrOrg: 'International 🌐',
        url: 'https://www.interpol.int/How-we-work/Notices/Red-Notices',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200'
      });
    }

    // 8. DFAT (Australie)
    if (datasets.some(d => d.includes('au_dfat') || d.includes('dfat')) || yenteId.startsWith('au-') || programs.includes('dfat')) {
      providers.push({
        code: 'AU_DFAT',
        name: 'DFAT (Australie)',
        authority: 'Australian Sanctions Office',
        countryOrOrg: 'Australie 🇦🇺',
        url: 'https://www.dfat.gov.au/international-relations/security/sanctions/consolidated-list',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200'
      });
    }

    // If no specific recognized, provide default Yente Internal Server info
    if (providers.length === 0) {
      providers.push({
        code: 'YENTE_REGISTRY',
        name: 'Registre Officiel Interne (Yente)',
        authority: 'Base Réglementaire Consolidée Alimentée en Interne',
        countryOrOrg: 'Interne / Souverain 🛡️',
        url: '',
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-200'
      });
    }

    return providers;
  }

  get primaryOfficialProvider(): OfficialProviderInfo {
    return this.officialProviders[0];
  }

  get parsedTopics(): TopicInfo[] {
    const props = this.yenteProperties;
    const topics: string[] = props['topics'] || [];
    if (topics.length === 0 && this.match.matchReason) {
      topics.push(...this.match.matchReason.split(',').map(s => s.trim().toLowerCase()));
    }

    return topics.map(t => {
      switch (t.toLowerCase()) {
        case 'sanction':
          return { label: 'Sanction Internationale', description: 'Sous le coup de mesures restrictives / sanctions', badgeClass: 'bg-rose-100 text-rose-800 border-rose-200' };
        case 'role.pep':
          return { label: 'Personne Politiquement Exposée (PPE)', description: 'Exerce ou a exercé d\'importantes fonctions publiques', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' };
        case 'role.rca':
          return { label: 'Proche / Associé de PPE (RCA)', description: 'Membre de la famille ou partenaire d\'affaires d\'une PPE', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' };
        case 'crime.terror':
          return { label: 'Terrorisme / Financement du terrorisme', description: 'Signalé pour des liens terroristes', badgeClass: 'bg-red-100 text-red-900 border-red-300' };
        case 'crime.fin':
          return { label: 'Criminalité Financière', description: 'Fraude fiscale, blanchiment, corruption', badgeClass: 'bg-rose-100 text-rose-800 border-rose-200' };
        case 'crime':
          return { label: 'Antécédents Criminels', description: 'Infraction pénale grave signalée', badgeClass: 'bg-rose-100 text-rose-800 border-rose-200' };
        case 'poi':
          return { label: 'Personne d\'Intérêt (POI)', description: 'Sous surveillance des autorités de régulation', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
        case 'corp.disqual':
          return { label: 'Interdiction de Gérer', description: 'Faillite ou interdiction de diriger des sociétés', badgeClass: 'bg-orange-100 text-orange-800 border-orange-200' };
        case 'wanted':
          return { label: 'Avis de Recherche', description: 'Recherché par Interpol / Europol / autorités', badgeClass: 'bg-red-100 text-red-900 border-red-300' };
        default:
          return { label: t.toUpperCase(), description: 'Signalement réglementaire', badgeClass: 'bg-slate-100 text-slate-800 border-slate-200' };
      }
    });
  }

  getDisplayName(): string {
    if (!this.client) return '';
    const c = this.client;
    return `${c.nom || c.nomCommercial || ''} ${c.prenom || ''}`.trim();
  }

  applyQuickReason(reason: QuickReason) {
    this.selectedReasonCode = reason.code;
    if (!this.comment || this.quickReasons.some(r => r.defaultText === this.comment)) {
      this.comment = reason.defaultText;
    } else {
      this.comment += ' ' + reason.defaultText;
    }
  }

  onDecision(decision: string) {
    if (this.isProcessing) return;

    if (!this.comment || this.comment.trim().length === 0) {
      this.alertService.displayMessage(
        'Justification Obligatoire',
        'Veuillez sélectionner un motif ou saisir un commentaire justifiant votre décision de conformité AML.',
        'warning'
      );
      return;
    }
    
    this.isProcessing = true;
    const reviewerName = 'Avocat Référent LCB-FT';
    
    this.matchService.processDecision(this.match.id!, decision, this.comment, reviewerName).subscribe({
      next: (updatedMatch) => {
        this.alertService.success('Décision de conformité enregistrée avec succès');
        this.decisionMade.emit(updatedMatch);
        this.isProcessing = false;
      },
      error: (err) => {
        this.alertService.displayMessage('Erreur', 'Erreur lors de l\'enregistrement de la décision', 'error');
        this.isProcessing = false;
      }
    });
  }

  onClose() {
    this.close.emit();
  }
}
