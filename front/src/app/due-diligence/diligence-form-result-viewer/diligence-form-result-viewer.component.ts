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
    styles: [`
        @media print {
            .no-print {
                display: none !important;
            }
            .min-h-screen {
                min-height: auto !important;
                background-color: white !important;
            }
            .max-w-4xl {
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .bg-slate-50 {
                background-color: white !important;
            }
            .shadow-sm {
                box-shadow: none !important;
            }
            .rounded-2xl, .rounded-3xl {
                border-radius: 0 !important;
            }
            .border {
                border-color: #e2e8f0 !important;
            }
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
        }
    `]
})
export class DiligenceFormResultViewerComponent implements OnInit {
    result: DiligenceFormResult | null = null;
    formConfig: FormConfig | null = null;
    client: Client | null = null;
    loading = true;

    printResult() {
        window.print();
    }

    getDisplayName(client: any): string {
        if (!client) return '';
        return `${client.nom || client.nomCommercial || ''} ${client.prenom || ''}`.trim();
    }

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

    getFieldResultObj(fieldId: string): FieldResult | null {
        if (!this.result) return null;
        return this.result.fieldResults.find(r => r.fieldConfigId === fieldId) || null;
    }

    // For checkboxes where multiple options might be selected
    getFieldOptionResult(fieldId: string, optionId: string): any {
        if (!this.result) return false;
        const fieldResult = this.result.fieldResults.find(r => r.fieldConfigId === fieldId && r.fieldOptionId === optionId);
        if (!fieldResult) return false;
        // Convert to boolean if it is a string representation of boolean
        if (fieldResult.value === 'true' || fieldResult.value === true) return true;
        if (fieldResult.value === 'false' || fieldResult.value === false) return false;
        return fieldResult.value;
    }

    getDisplayValue(field: FieldConfig): string {
        const resObj = this.getFieldResultObj(field.id!);
        if (!resObj) return '-';

        const value = resObj.value;
        const optionId = resObj.fieldOptionId;

        if (value === null || value === undefined) return '-';

        if (field.type === 'select' || field.type === 'radio') {
            const option = field.options?.find(o => 
                (optionId && o.id === optionId) || 
                o.id === value || 
                o.value === value
            );
            return option ? (option.name || option.value) : value;
        }

        return value;
    }

    goBack() {
        if (this.client) {
            this.navigationService.navigateToClientDiligenceResults(String(this.client.id!));
        } else {
            this.navigationService.navigateToClients();
        }
    }
}
