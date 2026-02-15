import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormResultService } from '../../services/form-result-service';
import { FormConfigService } from '../../services/form-config-service';
import { ClientService } from '../../services/client-service';
import { NavigationService } from '../../services/navigation-service';
import { Client, DiligenceFormResult, FieldConfig, FieldResult, FormConfig } from '../../appTypes';
import { forkJoin, switchMap, of, map } from 'rxjs';

@Component({
    selector: 'app-diligence-form-result-viewer',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './diligence-form-result-viewer.component.html',
})
export class DiligenceFormResultViewerComponent implements OnInit {
    result: DiligenceFormResult | null = null;
    formConfig: FormConfig | null = null;
    client: Client | null = null;
    loading = true;

    private route = inject(ActivatedRoute);
    private formResultService = inject(FormResultService);
    private formConfigService = inject(FormConfigService);
    private clientService = inject(ClientService);
    private navigationService = inject(NavigationService);

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.loadData(id);
            } else {
                this.navigationService.navigateToClients(); // Or somewhere else appropriate
            }
        });
    }

    private loadData(resultId: string) {
        this.loading = true;
        this.formResultService.findById(resultId).pipe(
            switchMap(result => {
                this.result = result;

                const requests: any = {
                    config: this.formConfigService.findById(result.formConfigId)
                };

                if (result.clientId) {
                    requests.client = this.clientService.findById(result.clientId);
                }

                return forkJoin(requests).pipe(
                    map((response: any) => ({
                        result,
                        config: response.config,
                        client: response.client || null
                    }))
                );
            })
        ).subscribe({
            next: ({ config, client }) => {
                this.formConfig = config;
                this.client = client;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading result data', err);
                // Handle error, maybe navigate back or show alert
                this.loading = false;
            }
        });
    }

    getFieldResult(fieldId: string): any {
        if (!this.result) return null;
        const fieldResult = this.result.fieldResults.find(r => r.fieldConfigId === fieldId);
        return fieldResult ? fieldResult.value : null;
    }

    // For checkboxes where multiple options might be selected
    getFieldOptionResult(fieldId: string, optionId: string): boolean {
        if (!this.result) return false;
        const fieldResult = this.result.fieldResults.find(r => r.fieldConfigId === fieldId && r.fieldOptionId === optionId);
        return fieldResult ? fieldResult.value : false;
    }

    getDisplayValue(field: FieldConfig): string {
        const value = this.getFieldResult(field.id!);
        if (value === null || value === undefined) return '-';

        if (field.type === 'select' || field.type === 'radio') {
            const option = field.options?.find(o => o.id === value);
            return option ? option.value : value;
        }

        return value;
    }

    goBack() {
        if (this.client) {
            this.navigationService.navigateToClientDiligenceResults(this.client.id!);
        } else {
            this.navigationService.navigateToClients();
        }
    }
}
