import { Component, ElementRef, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DocumentService } from '../../services/document.service';
import { AiSource, AiVerification } from './ai-sources.model';

/**
 * Panneau de fiabilité sous une réponse de l'IA : badge de vérification, alertes, références juridiques
 * contrôlées et liste des sources consultées (ouvrir le document à la bonne page, texte officiel...).
 */
@Component({
  selector: 'app-ai-sources-panel',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './ai-sources-panel.component.html'
})
export class AiSourcesPanelComponent {
  private documentService = inject(DocumentService);
  private router = inject(Router);
  private host = inject(ElementRef<HTMLElement>);

  @Input() sources: AiSource[] = [];
  @Input() verification?: AiVerification;
  /** Droit consulté (pays choisi + international), affiché sous le badge. */
  @Input() perimetre: string[] = [];
  /** Panneau replié par défaut quand la réponse est entièrement vérifiée. */
  @Input() compact = false;

  expanded = false;
  highlighted: string | null = null;
  opening: string | null = null;

  get open(): boolean {
    return this.expanded || !this.compact || this.hasBlocking;
  }

  get hasBlocking(): boolean {
    return (this.verification?.issues || []).some(i => i.severity === 'BLOQUANT');
  }

  get blockingIssues() {
    return (this.verification?.issues || []).filter(i => i.severity === 'BLOQUANT');
  }

  get notices() {
    return (this.verification?.issues || []).filter(i => i.severity !== 'BLOQUANT');
  }

  isCited(id: string): boolean {
    return (this.verification?.citedSources || []).includes(id);
  }

  badgeClass(): string {
    switch (this.verification?.status) {
      case 'VERIFIEE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PARTIELLE': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'A_CONTROLER': return 'bg-red-50 text-red-700 border-red-200';
      case 'NON_SOURCEE': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  }

  badgeIcon(): string {
    switch (this.verification?.status) {
      case 'VERIFIEE': return '✓';
      case 'PARTIELLE': return '◐';
      case 'SANS_SOURCE': return 'i';
      default: return '⚠';
    }
  }

  refClass(status: string): string {
    switch (status) {
      case 'TROUVEE_DANS_SOURCE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'VERIFIEE_OFFICIELLE': return 'bg-sky-50 text-sky-700 border-sky-200';
      default: return 'bg-red-50 text-red-700 border-red-200';
    }
  }

  /** Appelé quand l'avocat clique sur une pastille [S#] dans le texte. */
  focus(id: string): void {
    this.expanded = true;
    this.highlighted = id;
    setTimeout(() => {
      this.host.nativeElement.querySelector(`[data-source="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    setTimeout(() => this.highlighted = null, 2500);
  }

  /** Ouvre la pièce dans un nouvel onglet, à la page citée (le téléchargement est tracé dans le journal d'audit). */
  openDocument(source: AiSource): void {
    if (!source.documentId) return;
    const tab = window.open('', '_blank');
    this.opening = source.id;
    this.documentService.downloadDocumentFile(source.documentId).subscribe({
      next: blob => {
        this.opening = null;
        const url = URL.createObjectURL(blob) + (source.page ? `#page=${source.page}` : '');
        if (tab) tab.location.href = url; else window.open(url, '_blank');
      },
      error: () => { this.opening = null; tab?.close(); }
    });
  }

  openLink(source: AiSource): void {
    if (!source.link) return;
    const [path, query] = source.link.split('?');
    const queryParams = Object.fromEntries(new URLSearchParams(query || ''));
    this.router.navigate([path], { queryParams });
  }

  detailEntries(source: AiSource): { key: string; value: string }[] {
    return Object.entries(source.details || {}).map(([key, value]) => ({ key, value }));
  }
}
