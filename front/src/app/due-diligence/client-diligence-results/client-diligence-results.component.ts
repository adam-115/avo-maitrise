import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormResultService } from '../../services/form-result-service';
import { ClientService } from '../../services/client-service';
import { FormConfigService } from '../../services/form-config-service';
import { NavigationService } from '../../services/navigation-service';
import { Client, DiligenceFormResult, FormConfig } from '../../appTypes';
import { forkJoin, map, switchMap, of } from 'rxjs';

@Component({
    selector: 'app-client-diligence-results',
    standalone: true,
    imports: [CommonModule, DatePipe],
    templateUrl: './client-diligence-results.component.html',
})
export class ClientDiligenceResultsComponent implements OnInit {
    client: Client | null = null;
    results: DiligenceFormResult[] = [];
    formConfigs: Map<string, FormConfig> = new Map();
    loading = true;

    private route = inject(ActivatedRoute);
    private formResultService = inject(FormResultService);
    private clientService = inject(ClientService);
    private formConfigService = inject(FormConfigService);
    private navigationService = inject(NavigationService);

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

        // Load client and results in parallel
        forkJoin({
            client: this.clientService.findById(clientId),
            results: this.formResultService.findByClientId(clientId)
        }).pipe(
            switchMap(({ client, results }) => {
                this.client = client;
                this.results = results;

                // Extract unique form config IDs
                const configIds = [...new Set(results.map(r => r.formConfigId))];

                // Fetch all related form configs
                if (configIds.length > 0) {
                    const configRequests = configIds.map(id => this.formConfigService.findById(id));
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

    getFormTitle(configId: string): string {
        return this.formConfigs.get(configId)?.title || 'Formulaire Inconnu';
    }

    viewResult(result: DiligenceFormResult) {
        if (result.id) {
            this.navigationService.navigateToDiligenceFormResultViewer(result.id);
        }
    }

    backToClient() {
        if (this.client) {
            // Assuming we have a client details page
            this.navigationService.navigateToClientDetails(this.client.id!);
        } else {
            this.navigationService.navigateToClients();
        }
    }
}
