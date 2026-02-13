
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AmlFormConfig, AmlFormResult, Client } from '../../appTypes';
import { AlertService } from '../../services/alert-service';
import { AmlFormConfigService } from '../../services/AmlFormConfigService';
import { AmlFormResultService } from '../../services/aml-form-result-result-service';
import { ClientService } from '../../services/client-service';
import { NavigationService } from '../../services/navigation-service';

@Component({
    selector: 'app-client-aml-result',
    imports: [CommonModule],
    templateUrl: './client-aml-result.html',
    styleUrl: './client-aml-result.css'
})
export class ClientAmlResult implements OnInit {
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly clientService = inject(ClientService);
    private readonly amlResultService = inject(AmlFormResultService);
    private readonly alertService = inject(AlertService);
    private readonly navigationService = inject(NavigationService);
    private readonly amlFormConfigService = inject(AmlFormConfigService);


    client: Client | null = null;
    amlResults: AmlFormResult[] = [];
    isLoading = true;
    formConfigs: Map<number, AmlFormConfig> = new Map();

    ngOnInit(): void {
        this.loadData();
    }

    private loadData(): void {
        const clientId = this.activatedRoute.snapshot.paramMap.get('id');

        if (!clientId) {
            this.handleError('No client ID provided');
            return;
        }

        this.isLoading = true;

        // Parallel loading of client and AML results
        this.clientService.findById(clientId).subscribe({
            next: (client) => {
                this.client = client;
                this.loadAmlResults(clientId);
            },
            error: (err) => this.handleError('Error loading client data')
        });
    }

    private loadAmlResults(clientId: string): void {
        this.amlResultService.findByClientId(clientId).subscribe({
            next: (results) => {
                this.amlResults = results;
                this.loadFormConfigs(results);
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading AML results:', err);
                // We don't block the UI if AML results fail, just show client data
                this.isLoading = false;
                this.alertService.displayMessage('error', 'Failed to load AML results', 'error');
            }
        });
    }

    private loadFormConfigs(results: AmlFormResult[]): void {
        const configIds = new Set(results.map(r => r.amlFormConfigID).filter(id => id !== undefined) as number[]);

        configIds.forEach(id => {
            if (!this.formConfigs.has(id)) {
                this.amlFormConfigService.findById(id).subscribe({
                    next: (config) => {
                        this.formConfigs.set(id, config);
                    },
                    error: (err) => console.error(`Error loading config ${id}`, err)
                });
            }
        });
    }

    getQuestionLabel(configId: number | undefined, inputConfigId: string): string {
        if (!configId) return inputConfigId;

        const config = this.formConfigs.get(configId);
        if (!config) return inputConfigId;

        const inputConfig = config.inputConfigs.find(ic => ic.id === inputConfigId || ic.name === inputConfigId);
        return inputConfig ? inputConfig.labelMessage : inputConfigId;
    }

    private handleError(message: string): void {
        this.alertService.displayMessage('error', message, 'error');
        this.navigationService.navigateToClients();
    }

    goBack(): void {
        this.navigationService.navigateToClients();
    }

    navigateToClientDetails(): void {
        if (this.client?.id) {
            this.navigationService.navigateToClientDetails(this.client.id);
        }
    }

    navigateToAmlReview(): void {
        if (this.client?.id) {
            this.navigationService.navigateToClientAMLReview(this.client.id);
        }
    }
}
