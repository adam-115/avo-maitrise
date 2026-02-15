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

@Component({
    selector: 'app-client-diligence-results',
    standalone: true,
    imports: [CommonModule, DatePipe, FormsModule],
    templateUrl: './client-diligence-results.component.html',
})
export class ClientDiligenceResultsComponent implements OnInit {
    client: Client | null = null;
    results: DiligenceFormResult[] = [];
    formConfigs: Map<string, FormConfig> = new Map();
    assignments: ClientDiligenceStatus[] = [];
    availableForms: FormConfig[] = [];
    loading = true;
    showAssignDialog = false;
    selectedFormIdToAssign: string | null = null;

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
                this.loadAvailableForms();
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
                results.forEach(r => configIds.add(r.formConfigId));
                assignments.forEach(a => configIds.add(a.formConfigId));

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
            },
            error: (err) => {
                console.error('Error loading data', err);
                this.loading = false;
            }
        });
    }

    private loadAvailableForms() {
        this.formConfigService.getAll().subscribe(forms => {
            this.availableForms = forms;
        });
    }

    getFormTitle(configId: string): string {
        return this.formConfigs.get(configId)?.title || 'Formulaire Inconnu';
    }

    viewResult(resultId: string) {
        this.navigationService.navigateToDiligenceFormResultViewer(resultId);
    }

    fillForm(assignment: ClientDiligenceStatus) {
        // Navigate to form viewer with clientId query param
        // construct URL manually or add method to NavigationService
        // Using direct router navigation or adding to NavigationService
        // Ideally add to NavigationService, but for now I will inject Router or just use URL construction if navigationService supports queryParams
        // NavigationService usually wraps Router.
        // Let's assume we can navigate to form viewer and pass query params.
        // Since NavigationService.navigateToDiligenceFormResultViewer takes ID (result ID), we need a new method or use the generic one.
        // Actually, we need to navigate to the *Form Viewer* (to fill it), not the *Result Viewer*.
        // The Form Viewer route is `diligence-form-viewer/:id` (where ID is form config ID).
        this.navigationService.navigateToDiligenceFormViewer(assignment.formConfigId, this.client?.id);
    }

    backToClient() {
        if (this.client) {
            this.navigationService.navigateToClientDetails(this.client.id!);
        } else {
            this.navigationService.navigateToClients();
        }
    }

    openAssignDialog() {
        this.showAssignDialog = true;
        this.selectedFormIdToAssign = null;
    }

    closeAssignDialog() {
        this.showAssignDialog = false;
    }

    assignForm() {
        if (!this.selectedFormIdToAssign || !this.client) return;

        const newAssignment: ClientDiligenceStatus = {
            clientId: this.client.id!,
            formConfigId: this.selectedFormIdToAssign,
            status: 'PENDING'
        };

        this.statusService.create(newAssignment).subscribe({
            next: (assignment) => {
                this.assignments.push(assignment);
                // Also fetch the config if not already loaded
                if (!this.formConfigs.has(assignment.formConfigId)) {
                    this.formConfigService.findById(assignment.formConfigId).subscribe(config => {
                        this.formConfigs.set(config.id!, config);
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
}

