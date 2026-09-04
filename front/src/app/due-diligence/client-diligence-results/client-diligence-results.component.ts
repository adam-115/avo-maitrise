import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormResultService } from '../../services/form-result-service';
import { ClientService } from '../../services/client-service';
import { FormConfigService } from '../../services/form-config-service';
import { NavigationService } from '../../services/navigation-service';
import { ClientDiligenceStatusService } from '../../services/client-diligence-status-service';
import { Client, DiligenceFormResult, FormConfig, ClientDiligenceStatus } from '../../appTypes';
import { forkJoin, map, switchMap, of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../services/alert-service';
import { AssignFormModalComponent } from '../assign-form-modal/assign-form-modal.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-client-diligence-results',
    standalone: true,
    imports: [CommonModule, DatePipe, FormsModule, AssignFormModalComponent, TranslatePipe],
    templateUrl: './client-diligence-results.component.html',
    styles: [`
        @keyframes pulse-subtle {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.85; transform: scale(0.98); }
        }
        .pulse-subtle {
            animation: pulse-subtle 3s infinite ease-in-out;
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

    private route = inject(ActivatedRoute);
    private formResultService = inject(FormResultService);
    private clientService = inject(ClientService);
    private formConfigService = inject(FormConfigService);
    private navigationService = inject(NavigationService);
    private statusService = inject(ClientDiligenceStatusService);
    private alertService = inject(AlertService);
    private translate = inject(TranslateService);

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
        });
    }

    get pendingAssignments(): ClientDiligenceStatus[] {
        return this.assignments.filter(a => a.status === 'PENDING' && a.enabled !== false);
    }

    get totalCount(): number {
        return this.pendingAssignments.length + this.results.length;
    }

    get pendingCount(): number {
        return this.pendingAssignments.length;
    }

    get submittedCount(): number {
        return this.results.length;
    }

    get complianceRate(): number {
        const total = this.totalCount;
        if (total === 0) return 100;
        return Math.round((this.submittedCount / total) * 100);
    }

    getDisplayName(client: any): string {
        if (!client) return '';
        return `${client.nom || client.nomCommercial || ''} ${client.prenom || ''}`.trim();
    }

    isCompany(client: any): boolean {
        if (!client) return false;
        return client.type === 'PERSONNE_MORALE' || client.type === 'COMPANY' || !!client.nomCommercial;
    }

    getClientTypeKey(client: any): string {
        return this.isCompany(client) ? 'CLIENT_DILIGENCE_RESULTS.TYPE_COMPANY' : 'CLIENT_DILIGENCE_RESULTS.TYPE_INDIVIDUAL';
    }

    getInitials(client: any): string {
        if (!client) return 'CL';
        const name = this.getDisplayName(client);
        if (!name) return 'CL';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
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
            enabled: true
        };

        this.statusService.create(newAssignment).subscribe({
            next: (assignment) => {
                this.assignments.push(assignment);
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

    async deleteAssignment(id: string, event?: Event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        if (!id) return;
        
        const title = this.translate.instant('CLIENT_DILIGENCE_RESULTS.CONFIRM_DELETE_TITLE') || 'Supprimer l\'assignation';
        const msg = this.translate.instant('CLIENT_DILIGENCE_RESULTS.CONFIRM_DELETE_MSG') || 'Êtes-vous sûr de vouloir supprimer cette assignation ?';
        
        const confirmed = await this.alertService.confirmMessage(title, msg, 'warning');
        if (confirmed) {
            this.statusService.delete(id).subscribe({
                next: () => {
                    const index = this.assignments.findIndex(a => a.id === id);
                    if (index !== -1) {
                        this.assignments[index].enabled = false;
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
