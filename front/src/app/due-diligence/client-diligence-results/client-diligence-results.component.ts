import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormResultService } from '../../services/form-result-service';
import { ClientService } from '../../services/client-service';
import { FormConfigService } from '../../services/form-config-service';
import { NavigationService } from '../../services/navigation-service';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { ClientDiligenceStatusService } from '../../services/client-diligence-status-service';
import { Client, DiligenceFormResult, FormConfig, ClientDiligenceStatus, ClientStatus } from '../../appTypes';
import { forkJoin, map, switchMap, of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../services/alert-service';
import { AssignFormModalComponent } from '../assign-form-modal/assign-form-modal.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-client-diligence-results',
    standalone: true,
    imports: [CommonModule, DatePipe, FormsModule, AssignFormModalComponent, TranslatePipe],
    templateUrl: './client-diligence-results.component.html',
    styles: [`
        @keyframes blink-red {
            0% { border-color: rgba(244, 63, 94, 0.2); box-shadow: 0 0 0 rgba(244, 63, 94, 0); }
            50% { border-color: rgba(244, 63, 94, 1); box-shadow: 0 0 15px rgba(244, 63, 94, 0.3); }
            100% { border-color: rgba(244, 63, 94, 0.2); box-shadow: 0 0 0 rgba(244, 63, 94, 0); }
        }
        .blink-red-border {
            animation: blink-red 2s infinite ease-in-out;
            border-width: 2px !important;
        }
    `]
})
export class ClientDiligenceResultsComponent implements OnInit {
    client: Client | null = null;
    results: DiligenceFormResult[] = [];
    formConfigs: Map<string, FormConfig> = new Map();
    assignments: ClientDiligenceStatus[] = [];
    availableForms: FormConfig[] = [];
    loading = true;
    showAssignDialog = false;
    downloadingPdf = false;

    getDisplayName(client: any): string {
        if (!client) return '';
        return `${client.nom || client.nomCommercial || ''} ${client.prenom || ''}`.trim();
    }

    private route = inject(ActivatedRoute);
    private formResultService = inject(FormResultService);
    private clientService = inject(ClientService);
    private formConfigService = inject(FormConfigService);
    private navigationService = inject(NavigationService);
    private statusService = inject(ClientDiligenceStatusService);
    private alertService = inject(AlertService);

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            const clientId = params.get('id');
            if (clientId) {
                this.loadData(clientId);
            } else {
                this.navigationService.navigateToClients();
            }
        });
    }

    private loadData(clientId: string) {
        this.loading = true;

        forkJoin({
            client: this.clientService.findById(clientId),
            results: this.formResultService.findByClientId(clientId),
            assignments: this.statusService.findByClientId(clientId)
        }).pipe(
            switchMap(({ client, results, assignments }) => {
                this.client = client;
                this.results = results;
                this.assignments = assignments;

                // Extract unique form config IDs from results AND assignments
                const configIds = new Set<string>();
                results.forEach(r => configIds.add(String(r.formConfigId)));
                assignments.forEach(a => configIds.add(String(a.formConfigId)));

                if (configIds.size > 0) {
                    const configRequests = Array.from(configIds).map(id => this.formConfigService.findById(id));
                    return forkJoin(configRequests).pipe(
                        map(configs => {
                            configs.forEach(config => this.formConfigs.set(config.id!, config));
                            return configs;
                        })
                    );
                } else {
                    return of([]);
                }
            })
        ).subscribe({
            next: () => {
                this.loading = false;
                if (this.client?.type) {
                    this.loadAvailableForms(this.client.type);
                }
            },
            error: (err) => {
                console.error('Error loading data', err);
                this.loading = false;
            }
        });
    }

    private loadAvailableForms(clientType: string) {
        this.formConfigService.findAll(0, 100, undefined, { targetClientType: clientType }).subscribe(data => {
            this.availableForms = data.content;
            console.log("available forms for type " + clientType, this.availableForms);
        });
    }

    getFormTitle(configId: string): string {
        return this.formConfigs.get(configId)?.title || 'Formulaire Inconnu';
    }

    viewResult(resultId: string) {
        this.navigationService.navigateToDiligenceFormResultViewer(resultId);
    }

    fillForm(assignment: ClientDiligenceStatus) {
        this.navigationService.navigateToDiligenceFormViewer(String(assignment.formConfigId), String(this.client?.id), assignment.uboId);
    }

    backToClient() {
        if (this.client) {
            this.navigationService.navigateToClientDetails(String(this.client.id!));
        } else {
            this.navigationService.navigateToClients();
        }
    }

    openAssignDialog() {
        this.showAssignDialog = true;
    }

    closeAssignDialog() {
        this.showAssignDialog = false;
    }

    assignForm(assignmentData: {formId: string, uboId?: number}) {
        if (!assignmentData.formId || !this.client) return;

        const newAssignment: ClientDiligenceStatus = {
            clientId: this.client.id!,
            formConfigId: assignmentData.formId,
            uboId: assignmentData.uboId,
            status: 'PENDING', 
            enabled:true
        };

        this.statusService.create(newAssignment).subscribe({
            next: (assignment) => {
                this.assignments.push(assignment);
                // Also fetch the config if not already loaded
                if (!this.formConfigs.has(String(assignment.formConfigId))) {
                    this.formConfigService.findById(String(assignment.formConfigId)).subscribe(config => {
                        this.formConfigs.set(String(config.id!), config);
                    });
                }
                this.alertService.displayMessage('Succès', 'Formulaire assigné avec succès', 'success');
                this.closeAssignDialog();
            },
            error: (err) => {
                console.error('Error assigning form', err);
                this.alertService.displayMessage('Erreur', 'Erreur lors de l\'assignation', 'error');
            }
        });
    }

    deleteAssignment(id: string) {
        if (!id) return;
        
        if (confirm('Êtes-vous sûr de vouloir supprimer cette assignation ?')) {
            this.statusService.delete(id).subscribe({
                next: () => {
                    // Update local state - soft delete means it might still be in the list but disabled
                    // but usually we want to remove it from the "Actions Requises" view.
                    const index = this.assignments.findIndex(a => a.id === id);
                    if (index !== -1) {
                        this.assignments[index].enabled = false;
                        // For immediate feedback in the "Actions Requises" grid
                        this.assignments = [...this.assignments];
                    }
                    this.alertService.displayMessage('Succès', 'Assignation supprimée', 'success');
                },
                error: (err) => {
                    console.error('Error deleting assignment', err);
                    this.alertService.displayMessage('Erreur', 'Erreur lors de la suppression', 'error');
                }
            });
        }
    }

    downloadKycAuditPdf() {
        if (!this.client || !this.client.id) return;
        this.downloadingPdf = true;
        this.alertService.displayMessage('Génération en cours', 'Préparation de la Fiche de Vigilance KYC en cours...', 'info');
        
        this.clientService.generateClientKycAuditReportPdf(this.client.id).subscribe({
            next: (blob) => {
                this.downloadingPdf = false;
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
                this.alertService.displayMessage('Erreur', 'Impossible de générer le rapport LCB-FT (PDF)', 'error');
            }
        });
    }
}

