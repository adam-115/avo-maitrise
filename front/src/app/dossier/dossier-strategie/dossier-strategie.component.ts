import { Component, Input, OnInit, OnDestroy, ViewChild, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { AiSource, AiVerification } from '../../shared/ai-sources/ai-sources.model';
import { AiSourcesPanelComponent } from '../../shared/ai-sources/ai-sources-panel.component';
import { WordExportService } from '../../services/word-export.service';
import { VoiceNoteService } from '../../services/voice-note.service';

@Component({
    selector: 'app-dossier-strategie',
    standalone: true,
    imports: [CommonModule, FormsModule, AiSourcesPanelComponent],
    templateUrl: './dossier-strategie.component.html'
})
export class DossierStrategieComponent implements OnInit, OnDestroy {
    public voiceService = inject(VoiceNoteService);
    isChatDictating = signal<boolean>(false);
    chatDictationInterim = signal<string>('');
    speakingChatIdx = signal<number | null>(null);
    readonly isTtsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    @Input() dossierId!: string;
    @Input() selectedDossier: any;
    @ViewChild('sourcesPanel') sourcesPanel?: AiSourcesPanelComponent;

    isLoading = signal<boolean>(false);
    hasError = signal<boolean>(false);

    synthese = signal<SafeHtml>('');
    jurisprudence = signal<SafeHtml>('');
    failles = signal<SafeHtml>('');
    chances = signal<SafeHtml>('');
    strategieGagnante = signal<SafeHtml>('');
    workflow = signal<SafeHtml>('');
    tachesRecommandees = signal<SafeHtml>('');

    rawResponse = signal<string>('');
    /** Sources consultées pour l'analyse et verdict de la vérification automatique (événement SSE « SOURCES »). */
    aiSources = signal<AiSource[]>([]);
    aiVerification = signal<AiVerification | undefined>(undefined);
    /** Droit dans lequel la base légale a été cherchée (ex. FRANCE + INTERNATIONAL). */
    aiPerimetre = signal<string[]>([]);
    /** Message du serveur quand le pays de juridiction du dossier n'est pas défini (analyse non lancée). */
    paysManquant = signal<string | null>(null);

    // Chat properties
    chatHistory = signal<{ role: string, content: string }[]>([]);
    chatInput = signal<string>('');
    isChatLoading = signal<boolean>(false);
    isExportingWord = signal<boolean>(false);
    isExportingChatWord = signal<boolean>(false);

    constructor(private http: HttpClient, private sanitizer: DomSanitizer, private wordExportService: WordExportService) { }

    ngOnInit() {
        if (this.selectedDossier && this.selectedDossier.aiStrategy) {
            if (this.selectedDossier.aiStrategySources) {
                try {
                    const savedSources = JSON.parse(this.selectedDossier.aiStrategySources);
                    this.aiSources.set(savedSources.sources || []);
                    this.aiVerification.set(savedSources.verification);
                    this.aiPerimetre.set(savedSources.perimetre || []);
                } catch (e) {
                    console.error("Erreur parsing sources stratégie:", e);
                }
            }
            this.rawResponse.set(this.selectedDossier.aiStrategy);
            this.parseResponse(this.selectedDossier.aiStrategy);

            if (this.selectedDossier.aiChatHistory) {
                try {
                    const history = JSON.parse(this.selectedDossier.aiChatHistory);
                    this.chatHistory.set(history);
                } catch (e) {
                    console.error("Erreur parsing historique chat:", e);
                }
            }
        } else {
            this.generateStrategy();
        }
    }

    ngOnDestroy() {
        this.voiceService.stopRecognition();
        if (this.isTtsSupported) {
            try { window.speechSynthesis.cancel(); } catch { }
        }
    }

    toggleChatDictation() {
        if (this.isChatDictating()) {
            this.voiceService.stopRecognition();
            this.isChatDictating.set(false);
            this.chatDictationInterim.set('');
            return;
        }
        const started = this.voiceService.startRecognition('fr-FR', {
            onFinal: chunk => {
                const cur = this.chatInput().trim();
                this.chatInput.set(cur ? `${cur} ${chunk}` : chunk);
                this.chatDictationInterim.set('');
            },
            onInterim: text => this.chatDictationInterim.set(text),
            onError: () => {
                this.isChatDictating.set(false);
                this.chatDictationInterim.set('');
            },
            onEnd: () => {
                this.isChatDictating.set(false);
                this.chatDictationInterim.set('');
            }
        });
        this.isChatDictating.set(started);
    }

    toggleSpeakChat(content: string, idx: number) {
        if (!this.isTtsSupported || !content) return;
        if (this.speakingChatIdx() === idx) {
            try { window.speechSynthesis.cancel(); } catch { }
            this.speakingChatIdx.set(null);
            return;
        }
        try { window.speechSynthesis.cancel(); } catch { }
        const clean = content.replace(/\[S\d+\]/g, '').replace(/[#*_`>]/g, ' ').replace(/\s+/g, ' ').trim();
        if (!clean) return;
        const u = new SpeechSynthesisUtterance(clean);
        u.lang = 'fr-FR';
        u.onend = () => this.speakingChatIdx.set(null);
        u.onerror = () => this.speakingChatIdx.set(null);
        this.speakingChatIdx.set(idx);
        window.speechSynthesis.speak(u);
    }

    clearChat() {
        if (!confirm("Voulez-vous vraiment effacer l'historique de cette discussion ?")) return;

        this.chatHistory.set([]);
        this.http.delete(`${environment.apiUrl}ai/dossier/${this.dossierId}/chat`).subscribe({
            next: () => {
                if (this.selectedDossier) {
                    this.selectedDossier.aiChatHistory = null;
                }
            },
            error: (err) => console.error("Erreur suppression historique:", err)
        });
    }

    exportStrategyToWord() {
        if (!this.dossierId || this.isExportingWord()) return;
        this.isExportingWord.set(true);
        const ref = this.selectedDossier?.referenceInterne || this.dossierId;
        this.wordExportService.downloadStrategy(this.dossierId, `Strategie_${ref}.docx`).subscribe({
            next: () => this.isExportingWord.set(false),
            error: (err) => {
                console.error('Erreur export Word stratégie:', err);
                this.isExportingWord.set(false);
            }
        });
    }

    exportChatToWord() {
        if (!this.dossierId || this.isExportingChatWord()) return;
        this.isExportingChatWord.set(true);
        const ref = this.selectedDossier?.referenceInterne || this.dossierId;
        this.wordExportService.downloadChat(this.dossierId, `Discussion_IA_${ref}.docx`).subscribe({
            next: () => this.isExportingChatWord.set(false),
            error: (err) => {
                console.error('Erreur export Word discussion:', err);
                this.isExportingChatWord.set(false);
            }
        });
    }

    exportToPdf(elementId: string, title: string) {
        const data = document.getElementById(elementId);
        if (!data) return;

        // Création d'une iframe invisible pour l'impression
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        // Récupération de tous les styles (y compris ceux injectés par JS/Vite)
        let styles = '';
        for (let i = 0; i < document.styleSheets.length; i++) {
            try {
                const sheet = document.styleSheets[i];
                if (sheet.href) {
                    styles += `<link rel="stylesheet" href="${sheet.href}">`;
                } else {
                    let cssText = '';
                    const rules = sheet.cssRules || sheet.rules;
                    if (rules) {
                        for (let j = 0; j < rules.length; j++) {
                            cssText += rules[j].cssText + '\n';
                        }
                        styles += `<style>${cssText}</style>`;
                    }
                }
            } catch (e) {
                // Ignore CORS issues for external stylesheets
            }
        }

        const currentDate = new Date().toLocaleString('fr-FR');
        const cleanTitle = title.replace(/_/g, ' ');

        iframe.contentWindow?.document.open();
        iframe.contentWindow?.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${cleanTitle}</title>
          ${styles}
          <style>
             body { font-family: ui-sans-serif, system-ui, sans-serif; }
             /* Sécurité pour forcer la taille des icônes SVG si le CSS Tailwind manque */
             svg { max-width: 24px !important; max-height: 24px !important; display: inline-block; }
             
             @media print {
                 body { padding: 20px; background-color: white !important; -webkit-print-color-adjust: exact; }
                 .shadow-sm, .shadow-md, .shadow-2xl { box-shadow: none !important; }
                 /* Affichage propre des grilles en mode impression */
                 #strategy-grid { display: block !important; }
                 #strategy-grid > div { margin-bottom: 24px !important; page-break-inside: avoid; }
             }
          </style>
        </head>
        <body class="bg-white">
          <div class="mb-8 border-b pb-4">
              <h1 class="text-3xl font-bold text-slate-900">${cleanTitle}</h1>
              <p class="text-sm text-slate-500 mt-2">Généré le ${currentDate}</p>
          </div>
          ${data.innerHTML}
        </body>
      </html>
    `);
        iframe.contentWindow?.document.close();

        // Petit délai pour laisser le navigateur parser le CSS de Tailwind dans l'iframe
        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();

            // Nettoyage après impression
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 1000);
    }

    generateStrategy() {
        if (!this.dossierId) return;

        this.isLoading.set(true);
        this.hasError.set(false);
        this.paysManquant.set(null);
        this.aiPerimetre.set([]);
        this.rawResponse.set('');

        // Initialiser les blocs à "En cours de génération..."
        this.syntheseStr = '<span class="animate-pulse">Génération en cours...</span>';
        this.jurisprudenceStr = '<span class="animate-pulse">Génération en cours...</span>';
        this.faillesStr = '<span class="animate-pulse">Génération en cours...</span>';
        this.chancesStr = '<span class="animate-pulse">Génération en cours...</span>';
        this.strategieStr = '<span class="animate-pulse">Génération en cours...</span>';
        this.workflowStr = '<span class="animate-pulse">Génération en cours...</span>';
        this.tachesStr = '<span class="animate-pulse">Génération en cours...</span>';

        this.synthese.set(this.sanitizer.bypassSecurityTrustHtml(this.syntheseStr));
        this.jurisprudence.set(this.sanitizer.bypassSecurityTrustHtml(this.jurisprudenceStr));
        this.failles.set(this.sanitizer.bypassSecurityTrustHtml(this.faillesStr));
        this.chances.set(this.sanitizer.bypassSecurityTrustHtml(this.chancesStr));
        this.strategieGagnante.set(this.sanitizer.bypassSecurityTrustHtml(this.strategieStr));
        this.workflow.set(this.sanitizer.bypassSecurityTrustHtml(this.workflowStr));
        this.tachesRecommandees.set(this.sanitizer.bypassSecurityTrustHtml(this.tachesStr));

        this.aiSources.set([]);
        this.aiVerification.set(undefined);
        const url = `${environment.apiUrl}ai/analyze-stream?dossierId=${this.dossierId}`;
        const eventSource = new EventSource(url);

        let accumulatedText = "";

        eventSource.onmessage = (event) => {
            try {
                const parsed = JSON.parse(event.data);
                this.isLoading.set(false); // On enlève le gros spinner dès qu'on a la 1ère lettre
                accumulatedText += parsed.token;
                this.rawResponse.set(accumulatedText);
                // On met à jour les 4 blocs en temps réel
                this.parseResponse(accumulatedText);
            } catch (e) {
                console.error("Erreur parsing SSE JSON:", e);
            }
        };

        eventSource.addEventListener('SOURCES', (event: MessageEvent) => {
            try {
                const payload = JSON.parse(event.data);
                this.aiSources.set(payload.sources || []);
                this.aiVerification.set(payload.verification);
                this.aiPerimetre.set(payload.perimetre || []);
                if (this.selectedDossier) {
                    this.selectedDossier.aiStrategySources = event.data;
                }
                // Re-parse pour enrichir les infobulles (title) des pastilles [S#] dès que les sources arrivent
                if (accumulatedText) {
                    this.parseResponse(accumulatedText);
                }
            } catch (e) {
                console.error('Erreur lecture des sources:', e);
            }
        });

        // Pays de juridiction non défini : le serveur n'analyse pas (il ne devine pas le droit applicable)
        eventSource.addEventListener('PAYS_MANQUANT', (event: MessageEvent) => {
            let message = 'Le pays de juridiction du dossier n\'est pas défini.';
            try { message = JSON.parse(event.data).message || message; } catch (e) { /* message par défaut */ }
            this.paysManquant.set(message);
            this.isLoading.set(false);
            eventSource.close();
        });

        eventSource.addEventListener('DONE', () => {
            console.log("Streaming terminé.");
            eventSource.close();
        });

        eventSource.onerror = (error) => {
            console.error("Erreur EventSource", error);
            if (accumulatedText.trim().length === 0) {
                this.hasError.set(true);
                this.isLoading.set(false);
            }
            eventSource.close();
        };
    }

    private syntheseStr = '<span class="animate-pulse">Génération en cours...</span>';
    private jurisprudenceStr = '<span class="animate-pulse">Génération en cours...</span>';
    private faillesStr = '<span class="animate-pulse">Génération en cours...</span>';
    private chancesStr = '<span class="animate-pulse">Génération en cours...</span>';
    private strategieStr = '<span class="animate-pulse">Génération en cours...</span>';
    private workflowStr = '<span class="animate-pulse">Génération en cours...</span>';
    private tachesStr = '<span class="animate-pulse">Génération en cours...</span>';

    private parseResponse(text: string) {
        const sections = text.split(/(?=### )/g);

        for (const section of sections) {
            const lines = section.split('\n');
            const titleLine = lines.length > 0 ? lines[0] : section;
            const normalizedTitle = titleLine.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            // On extrait le contenu (on enlève le titre ###)
            const content = section.replace(/###.*?(?:\n|$)/, '').trim();
            if (content === '') continue;

            if (normalizedTitle.includes('synthese') || normalizedTitle.includes('enjeux') || normalizedTitle.includes('contexte')) {
                this.syntheseStr = content;
            } else if (normalizedTitle.includes('jurisprudence') || normalizedTitle.includes('loi') || normalizedTitle.includes('legal')) {
                this.jurisprudenceStr = content;
            } else if (normalizedTitle.includes('chance') || normalizedTitle.includes('pourcentage') || normalizedTitle.includes('succes')) {
                this.chancesStr = content;
            } else if (normalizedTitle.includes('faille') || normalizedTitle.includes('risque') || normalizedTitle.includes('faiblesse')) {
                this.faillesStr = content;
            } else if (normalizedTitle.includes('strategie') || normalizedTitle.includes('gagnante')) {
                this.strategieStr = content;
            } else if (normalizedTitle.includes('workflow') || normalizedTitle.includes('deroulement')) {
                this.workflowStr = content;
            } else if (normalizedTitle.includes('tache') || normalizedTitle.includes('action') || normalizedTitle.includes('recommandee')) {
                this.tachesStr = content;
            } else if (sections.length === 1 && !titleLine.toLowerCase().includes('###')) {
                this.syntheseStr = text;
            }
        }

        this.synthese.set(this.formatMarkdown(this.syntheseStr));
        this.jurisprudence.set(this.formatMarkdown(this.jurisprudenceStr));
        this.failles.set(this.formatMarkdown(this.faillesStr));
        this.chances.set(this.formatMarkdown(this.chancesStr));
        this.strategieGagnante.set(this.formatMarkdown(this.strategieStr));
        this.workflow.set(this.formatMarkdown(this.workflowStr));
        this.tachesRecommandees.set(this.formatMarkdown(this.tachesStr));
    }

    private escapeHtml(raw: string): string {
        return raw
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    private escapeAttr(raw: string): string {
        return raw
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    private getSourceBadgeStyle(src?: AiSource): { badge: string; link: string; icon: string } {
        switch (src?.kind) {
            case 'DOCUMENT':
                return { badge: 'bg-pink-600 text-white hover:bg-pink-700', link: 'bg-pink-100 text-pink-800 hover:bg-pink-200', icon: '📄' };
            case 'JURISPRUDENCE':
                return { badge: 'bg-indigo-600 text-white hover:bg-indigo-700', link: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200', icon: '⚖️' };
            case 'LEGISLATION':
                return { badge: 'bg-sky-600 text-white hover:bg-sky-700', link: 'bg-sky-100 text-sky-800 hover:bg-sky-200', icon: '📘' };
            case 'DONNEE':
                return { badge: 'bg-emerald-600 text-white hover:bg-emerald-700', link: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200', icon: '🗂️' };
            default:
                return { badge: 'bg-pink-600 text-white hover:bg-pink-700', link: 'bg-pink-100 text-pink-800 hover:bg-pink-200', icon: '🔗' };
        }
    }

    formatMarkdown(text: string): SafeHtml {
        if (!text) return '';
        if (text.includes('Génération en cours...')) {
            return this.sanitizer.bypassSecurityTrustHtml(text);
        }
        const sources = this.aiSources();
        const html = this.escapeHtml(text)
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^- (.*)$/gm, '<li class="ml-4 list-disc">$1</li>')
            // Citations [S1] / [S1, S3] : pastilles distinctes + lien direct vers la source
            .replace(/\[(S\d+(?:\s*[,;]\s*S\d+)*)\]/g, (_m: string, ids: string) => ids.split(/\s*[,;]\s*/)
                .map(rawId => {
                    const id = rawId.trim();
                    const src = sources.find(s => s.id === id);
                    const style = this.getSourceBadgeStyle(src);
                    const title = this.escapeAttr(
                        src
                            ? `${src.title}${src.page ? ' · p. ' + src.page : ''} — Cliquer pour voir l'extrait`
                            : `Voir la source ${id}`
                    );
                    const badgeBtn = `<button type="button" data-cite-id="${id}" title="${title}" class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold leading-4 shadow-sm cursor-pointer align-baseline transition-colors ${style.badge}">${style.icon} ${id}</button>`;

                    let directLink = '';
                    if (src?.officialUrl) {
                        const safeUrl = this.escapeAttr(src.officialUrl);
                        directLink = `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" title="Ouvrir le texte officiel (${this.escapeAttr(src.title)})" class="inline-flex items-center px-1 py-0.5 rounded-md text-[10px] font-bold leading-4 transition-colors no-underline ${style.link}">↗</a>`;
                    } else if (src?.documentId) {
                        directLink = `<button type="button" data-open-doc="${id}" title="Ouvrir le document (${this.escapeAttr(src.title)}${src.page ? ' · p. ' + src.page : ''})" class="inline-flex items-center px-1 py-0.5 rounded-md text-[10px] font-bold leading-4 cursor-pointer transition-colors ${style.link}">↗</button>`;
                    } else if (src?.link) {
                        directLink = `<button type="button" data-open-link="${id}" title="Ouvrir la source dans l'application (${this.escapeAttr(src.title)})" class="inline-flex items-center px-1 py-0.5 rounded-md text-[10px] font-bold leading-4 cursor-pointer transition-colors ${style.link}">↗</button>`;
                    }

                    return `<span class="inline-flex items-center gap-0.5 mx-0.5 align-baseline">${badgeBtn}${directLink}</span>`;
                })
                .join(''))
            .replace(/\n/g, '<br/>');
        return this.sanitizer.bypassSecurityTrustHtml(html);
    }

    /** Intercepte le clic sur une pastille [S#] ou son lien direct ↗ pour scroller ou ouvrir la source. */
    onStrategyClick(event: MouseEvent): void {
        const el = event.target as HTMLElement | null;
        if (!el) return;

        const openDocEl = el.closest('[data-open-doc]') as HTMLElement | null;
        if (openDocEl) {
            event.preventDefault();
            const id = openDocEl.getAttribute('data-open-doc');
            const src = this.aiSources().find(s => s.id === id);
            if (src && this.sourcesPanel) {
                this.sourcesPanel.openDocument(src);
            }
            return;
        }

        const openLinkEl = el.closest('[data-open-link]') as HTMLElement | null;
        if (openLinkEl) {
            event.preventDefault();
            const id = openLinkEl.getAttribute('data-open-link');
            const src = this.aiSources().find(s => s.id === id);
            if (src && this.sourcesPanel) {
                this.sourcesPanel.openLink(src);
            }
            return;
        }

        const target = el.closest('[data-cite-id]') as HTMLElement | null;
        const citeId = target?.getAttribute('data-cite-id');
        if (citeId && this.sourcesPanel) {
            this.sourcesPanel.focus(citeId);
        }
    }

    sendMessage() {
        const text = this.chatInput().trim();
        if (!text || this.isChatLoading()) return;

        this.chatInput.set('');

        const newHistory = [...this.chatHistory(), { role: 'user', content: text }];
        this.chatHistory.set(newHistory);
        this.isChatLoading.set(true);

        const payload = {
            dossierId: parseInt(this.dossierId, 10),
            history: newHistory
        };

        this.http.post<{ result: string }>(`${environment.apiUrl}ai/chat-dossier`, payload)
            .subscribe({
                next: (response) => {
                    this.chatHistory.set([...this.chatHistory(), { role: 'ai', content: response.result }]);
                    this.isChatLoading.set(false);
                },
                error: (err) => {
                    console.error("Erreur chat dossier:", err);
                    this.chatHistory.set([...this.chatHistory(), { role: 'ai', content: 'Désolé, une erreur est survenue lors de la communication.' }]);
                    this.isChatLoading.set(false);
                }
            });
    }
}
