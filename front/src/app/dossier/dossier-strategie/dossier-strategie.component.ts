import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dossier-strategie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dossier-strategie.component.html'
})
export class DossierStrategieComponent implements OnInit {
  @Input() dossierId!: string;
  @Input() selectedDossier: any;

  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);
  
  synthese = signal<string>('');
  jurisprudence = signal<string>('');
  failles = signal<string>('');
  chances = signal<string>('');
  strategieGagnante = signal<string>('');
  workflow = signal<string>('');
  tachesRecommandees = signal<string>('');

  rawResponse = signal<string>('');

  // Chat properties
  chatHistory = signal<{role: string, content: string}[]>([]);
  chatInput = signal<string>('');
  isChatLoading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    if (this.selectedDossier && this.selectedDossier.aiStrategy) {
        this.rawResponse.set(this.selectedDossier.aiStrategy);
        this.parseResponse(this.selectedDossier.aiStrategy);
    } else {
        this.generateStrategy();
    }
  }

  generateStrategy() {
    if (!this.dossierId) return;

    this.isLoading.set(true);
    this.hasError.set(false);
    this.rawResponse.set('');
    
    // Initialiser les blocs à "En cours de génération..."
    this.syntheseStr = '<span class="animate-pulse">Génération en cours...</span>';
    this.jurisprudenceStr = '<span class="animate-pulse">Génération en cours...</span>';
    this.faillesStr = '<span class="animate-pulse">Génération en cours...</span>';
    this.chancesStr = '<span class="animate-pulse">Génération en cours...</span>';
    this.strategieStr = '<span class="animate-pulse">Génération en cours...</span>';
    this.workflowStr = '<span class="animate-pulse">Génération en cours...</span>';
    this.tachesStr = '<span class="animate-pulse">Génération en cours...</span>';

    this.synthese.set(this.syntheseStr);
    this.jurisprudence.set(this.jurisprudenceStr);
    this.failles.set(this.faillesStr);
    this.chances.set(this.chancesStr);
    this.strategieGagnante.set(this.strategieStr);
    this.workflow.set(this.workflowStr);
    this.tachesRecommandees.set(this.tachesStr);

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
  
  private formatMarkdown(text: string): string {
      return text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
                 .replace(/\*(.*?)\*/g, '<em>$1</em>')
                 .replace(/- (.*)/g, '<li class="ml-4 list-disc">$1</li>')
                 .replace(/\n/g, '<br/>');
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

    this.http.post<{result: string}>(`${environment.apiUrl}ai/chat-dossier`, payload)
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
