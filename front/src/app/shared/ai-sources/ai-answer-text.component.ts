import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { AiSource, AiVerification, AnswerSegment, buildSegments } from './ai-sources.model';

/**
 * Texte d'une réponse de l'IA : les citations [S#] deviennent des pastilles cliquables (extrait au survol),
 * les références non vérifiées sont surlignées en rouge avec l'explication au survol.
 */
@Component({
  selector: 'app-ai-answer-text',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="whitespace-pre-wrap break-words leading-relaxed"><ng-container *ngFor="let s of segments"><ng-container *ngIf="s.type === 'text'">{{ s.value }}</ng-container><span *ngIf="s.type === 'flag'" class="bg-red-100 text-red-800 underline decoration-wavy decoration-red-500 rounded px-0.5 cursor-help" [title]="s.message">{{ s.value }}</span><ng-container *ngIf="s.type === 'cite'"><button *ngFor="let id of s.ids; let i = index" type="button" (click)="cite.emit(id)"
        class="inline-flex items-center align-baseline mx-0.5 px-1.5 rounded-md text-[10px] font-bold leading-4 transition-colors"
        [ngClass]="s.known?.[i] ? 'bg-pink-600 text-white hover:bg-pink-700' : 'bg-red-600 text-white line-through'"
        [title]="tooltip(id, s.known?.[i])">{{ id }}</button></ng-container></ng-container></div>
  `
})
export class AiAnswerTextComponent implements OnChanges {
  @Input() text = '';
  @Input() sources: AiSource[] = [];
  @Input() verification?: AiVerification;
  @Output() cite = new EventEmitter<string>();

  segments: AnswerSegment[] = [];

  ngOnChanges(): void {
    this.segments = buildSegments(this.text || '', this.verification, this.sources);
  }

  private translate = inject(TranslateService);

  tooltip(id: string, known?: boolean): string {
    if (!known) return this.translate.instant('AI_SOURCES.UNKNOWN_SOURCE', { id });
    const s = this.sources.find(x => x.id === id);
    return s ? `${s.title}${s.page ? ' · p. ' + s.page : ''}\n${s.excerpt}` : id;
  }
}
