import { Component, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AiAnswerPayload, AiSource, AiVerification } from '../../shared/ai-sources/ai-sources.model';
import { AiAnswerTextComponent } from '../../shared/ai-sources/ai-answer-text.component';
import { AiSourcesPanelComponent } from '../../shared/ai-sources/ai-sources-panel.component';
import { PAYS_JURIDICTION, normalizePays } from '../../shared/ai-sources/pays';
import { TranslatePipe } from '@ngx-translate/core';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  isLoading?: boolean;
  /** Sources consultées et verdict de la vérification automatique (réponses de l'assistant). */
  sources?: AiSource[];
  verification?: AiVerification;
  perimetre?: string[];
}

@Component({
  selector: 'app-ai-tester',
  standalone: true,
  imports: [CommonModule, FormsModule, AiAnswerTextComponent, AiSourcesPanelComponent, TranslatePipe],
  templateUrl: './ai-tester.component.html',
  styleUrls: ['./ai-tester.component.css']
})
export class AiTesterComponent implements AfterViewChecked {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  promptText = signal<string>('');
  messages = signal<ChatMessage[]>([{
    role: 'assistant',
    text: 'Bonjour ! Je suis l\'intelligence artificielle d\'Avo-Maîtrise. Comment puis-je vous aider aujourd\'hui ?'
  }]);
  
  isLoading = signal<boolean>(false);
  activeMode = signal<'chat' | 'avocat-assistant' | 'summarize' | 'draft'>('avocat-assistant');
  
  sessionId = crypto.randomUUID();

  /** Droit applicable choisi par l'avocat : la jurisprudence n'est cherchée que dans ce pays (+ international). */
  readonly paysOptions = PAYS_JURIDICTION;
  pays = signal<string>(AiTesterComponent.loadPays());

  private static loadPays(): string {
    try { return normalizePays(localStorage.getItem('avo.ai.pays')) || 'FRANCE'; } catch { return 'FRANCE'; }
  }

  setPays(value: string): void {
    this.pays.set(value);
    try { localStorage.setItem('avo.ai.pays', value); } catch { /* stockage indisponible */ }
  }

  // For draft
  draftContext = signal<string>('');
  draftType = signal<string>('mise en demeure');

  constructor(private http: HttpClient) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }

  setMode(mode: 'chat' | 'avocat-assistant' | 'summarize' | 'draft') {
    this.activeMode.set(mode);
  }

  submit() {
    if (this.isLoading()) return;
    const mode = this.activeMode();
    const prompt = this.promptText().trim();
    
    if (mode === 'chat' || mode === 'avocat-assistant' || mode === 'summarize') {
      if (!prompt) return;
    }

    let endpoint = '';
    let body: any = {};
    let displayPrompt = prompt;

    if (mode === 'summarize') {
      endpoint = `${environment.apiUrl}ai/summarize`;
      body = { text: prompt };
      displayPrompt = "Résume ce texte : \n" + prompt;
    } else if (mode === 'draft') {
      endpoint = `${environment.apiUrl}ai/draft`;
      body = { context: this.draftContext(), documentType: this.draftType() };
      displayPrompt = `Rédige un(e) ${this.draftType()} pour le contexte : \n${this.draftContext()}`;
      if (!this.draftContext().trim()) return;
    } else if (mode === 'avocat-assistant') {
      endpoint = `${environment.apiUrl}ai/analyze`;
      body = { message: prompt, sessionId: this.sessionId, pays: this.pays() };
    } else {
      endpoint = `${environment.apiUrl}ai/chat`;
      body = { message: prompt, sessionId: this.sessionId, pays: this.pays() };
    }

    this.messages.update(msgs => [...msgs, { role: 'user', text: displayPrompt }]);
    this.promptText.set('');
    if (mode === 'draft') {
       this.draftContext.set('');
    }

    this.isLoading.set(true);
    
    // Add loading bubble
    this.messages.update(msgs => [...msgs, { role: 'assistant', text: '', isLoading: true }]);

    this.http.post<AiAnswerPayload>(endpoint, body).subscribe({
      next: (res) => {
        this.messages.update(msgs => {
          const newMsgs = [...msgs];
          newMsgs.pop(); // remove loading bubble
          newMsgs.push({ role: 'assistant', text: res.result, sources: res.sources, verification: res.verification, perimetre: res.perimetre });
          return newMsgs;
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur IA:', err);
        let errorMsg = 'Une erreur est survenue lors de l\'appel à l\'IA.';
        if (err.status === 400 && err.error && err.error.error) {
          errorMsg = 'Erreur : ' + err.error.error;
        } else if (err.status === 500) {
           errorMsg += ' Erreur interne du serveur.';
        }
        
        this.messages.update(msgs => {
          const newMsgs = [...msgs];
          newMsgs.pop(); // remove loading bubble
          newMsgs.push({ role: 'assistant', text: `❌ ${errorMsg}` });
          return newMsgs;
        });
        this.isLoading.set(false);
      }
    });
  }

  onKeydown(event: Event) {
    const kbEvent = event as KeyboardEvent;
    if (kbEvent.key === 'Enter' && !kbEvent.shiftKey) {
      kbEvent.preventDefault();
      this.submit();
    }
  }
}

