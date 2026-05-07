import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Client, ClientStatus, Document, YenteMatchResponse, ScreeningExecutionDTO, ScreeningMatchDTO, ScreeningExecutionStatus } from '../../appTypes';

import { FormsModule } from '@angular/forms';
import { AlertService } from '../../services/alert-service';
import { ClientService } from '../../services/client-service';
import { NavigationService } from '../../services/navigation-service';
import { AmlService } from '../../services/aml-service';
import { ScreeningExecutionService } from '../../services/screening-execution.service';
import { ScreeningMatchService } from '../../services/screening-match.service';

@Component({
  selector: 'app-client-details',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './client-details.html',
  styleUrl: './client-details.css'
})
export class ClientDetails implements OnInit {

  clientService = inject(ClientService);
  screeningExecutionService = inject(ScreeningExecutionService);
  screeningMatchService = inject(ScreeningMatchService);

  client: Client | null = null;
  executions: ScreeningExecutionDTO[] = [];
  matches: ScreeningMatchDTO[] = [];

  isLoading = true;

  getDisplayName(client: any): string {
    if (!client) return '';
    return `${client.nom || client.nomCommercial || ''} ${client.prenom || ''}`.trim();
  }

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly navigationService = inject(NavigationService);
  private readonly alertService = inject(AlertService);
  private readonly amlService = inject(AmlService);

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

  private extractDocuments() {
    // Map existing client documents if they exist
    if (this.client && this.client.documents) {
      this.client.documents = this.client.documents.map((d: any) => ({
        label: d.title || 'Document Client',
        filename: d.name || d.filename || 'unknown',
        date: new Date() // Date handling could be improved if API provides it
      }));
    } else if (this.client) {
      this.client.documents = [];
    }
  }

  isFile(value: string): boolean {
    if (!value) return false; // Ensure value is not null/undefined
    const extensions = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.csv'];
    return extensions.some(ext => value.toLowerCase().endsWith(ext));
  }

  startDueDiligence() {
    this.verifyAml();
  }

  editClient() {
    console.log('Edit client', this.client?.id);
    this.navigationService.navigateToClientEdit(String(this.client?.id));
  }

  downloadDocument(doc: Document) {
    console.log("doc.file" + doc.file);

    if (doc.file) {
      const url = URL.createObjectURL(doc.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.filename || doc.name || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      console.log('Download document', doc);
    }
  }

  async onStatusChange(newStatus: string) {
    if (!this.client) return;

    const previousStatus = this.client.clientStatus;

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
          this.alertService.displayMessage('Erreur', 'Impossible de mettre à jour le statut.', 'error');
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
            this.client!.clientStatus = ClientStatus.SUSPICIOUS;
          } else {
            this.client!.clientStatus = ClientStatus.AML_VALIDATED;
          }
        }

        if (!this.client!.clientStatus) {
           this.client!.clientStatus = ClientStatus.AML_REQUIRED;
        }

        this.clientService.update(this.client!.id, this.client!).subscribe({
          next: () => {
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
    
    if (match.rawResponse) {
      let parsed = match.rawResponse;
      if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch {}
      }
      
      const responses = parsed?.responses;
      if (responses) {
        const queryKey = Object.keys(responses)[0];
        if (queryKey && responses[queryKey]?.results) {
          const results = responses[queryKey].results;
          const found = results.find((r: any) => r.id === match.yenteId);
          if (found?.properties?.name?.[0]) {
            return found.properties.name[0];
          }
        }
      }
    }
    
    return 'Inconnu';
  }

  getHighestMatchScore(): number {
    if (!this.matches || this.matches.length === 0) return 0;
    return Math.max(...this.matches.map(m => m.score || 0));
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
}


