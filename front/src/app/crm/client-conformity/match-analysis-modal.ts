import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScreeningMatchDTO, ScreeningMatchStatus, Client } from '../../appTypes';
import { ScreeningMatchService } from '../../services/screening-match.service';
import { AlertService } from '../../services/alert-service';

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
  isProcessing: boolean = false;

  get yenteProperties() {
    return this.match.rawResponse?.responses?.['query-1']?.results?.find((r: any) => r.id === this.match.yenteId)?.properties || {};
  }

  get yenteMeta() {
     const result = this.match.rawResponse?.responses?.['query-1']?.results?.find((r: any) => r.id === this.match.yenteId);
     return {
        score: result?.score,
        datasets: result?.datasets,
        schema: result?.schema,
        lastChange: result?.last_change,
        firstSeen: result?.first_seen
     };
  }

  getDisplayName(): string {
    if (!this.client) return '';
    const c = this.client;
    return (c.nom || '') + ' ' + (c.prenom || '') + (c.nomCommercial || '');
  }

  onDecision(decision: string) {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.matchService.processDecision(this.match.id!, decision, this.comment, 'Avocat Gérant').subscribe({
      next: (updatedMatch) => {
        this.alertService.success('Décision enregistrée avec succès');
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
