import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Client, DiligenceFormResult, FieldConfig, FieldResult, FormConfig } from '../../appTypes';
import { AlertService } from '../../services/alert-service';
import { FormConfigService } from '../../services/form-config-service';
import { NavigationService } from '../../services/navigation-service';
import { ClientService } from '../../services/client-service';
import { FormResultService } from '../../services/form-result-service';
import { ClientDiligenceStatusService } from '../../services/client-diligence-status-service';

@Component({
    selector: 'app-diligence-form-viewer',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './diligence-form-viewer.component.html',
})
export class DiligenceFormViewerComponent implements OnInit {
    formConfig: FormConfig | null = null;
    diligenceForm: FormGroup = new FormGroup({});
    selectedClient: Client | null = null;

    private route = inject(ActivatedRoute);
    private fb = inject(FormBuilder);
    private formConfigService = inject(FormConfigService);
    private alertService = inject(AlertService);
    private navigationService = inject(NavigationService);
    private clientService = inject(ClientService);
    private formResultService = inject(FormResultService);
    private statusService = inject(ClientDiligenceStatusService);


    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.loadFormConfig(id);
            } else {
                this.alertService.displayMessage('Erreur', 'Identifiant du formulaire manquant', 'error');
                this.navigationService.navigateToFormConfigList();
            }
        });

        // Get clientId from query params
        this.route.queryParams.subscribe(params => {
            const clientId = params['clientId'];
            if (clientId) {
                this.loadClient(clientId);
            }
        });
    }

    private loadFormConfig(id: string) {
        this.formConfigService.findById(id).subscribe({
            next: (config) => {
                this.formConfig = config;
                this.buildForm(config.fields);
            },
            error: (err) => {
                console.error('Error loading form config', err);
                this.alertService.displayMessage('Erreur', 'Impossible de charger le formulaire', 'error');
                this.navigationService.navigateToFormConfigList();
            }
        });
    }

    private loadClient(clientId: string) {
        this.clientService.findById(clientId).subscribe({
            next: (client) => {
                this.selectedClient = client;
            },
            error: (err) => {
                console.error('Error loading client', err);
            }
        });
    }

    private buildForm(fields: FieldConfig[]) {
        this.diligenceForm = this.fb.group({});
        fields.forEach(field => {
            this.createFormControl(field);
        });
    }

    private createFormControl(field: FieldConfig) {
        if (!field.id) return;

        // case text or textarea
        if (field.type === 'text' || field.type === 'textarea') {
            const control = field.required
                ? this.fb.control('', Validators.required)
                : this.fb.control('');
            this.diligenceForm.addControl(field.id, control);
        }
        // case select
        if (field.type === 'select') {
            const control = field.required
                ? this.fb.control(null, Validators.required)
                : this.fb.control(null);
            this.diligenceForm.addControl(field.id, control);
        }

        if (field.type === 'radio') {
            const control = field.required
                ? this.fb.control(null, Validators.required)
                : this.fb.control(null);
            this.diligenceForm.addControl(field.id, control);
        }

        if (field.type === 'checkbox' && field.options) {
            field.options.forEach(option => {
                const control = field.required
                    ? this.fb.control(false, Validators.requiredTrue)
                    : this.fb.control(false);
                this.diligenceForm.addControl(option.id!, control);
            });
        }
    }

    onSubmit() {
        if (this.diligenceForm.invalid) {
            this.diligenceForm.markAllAsTouched();
            this.alertService.displayMessage('Attention', 'Veuillez remplir correctement tous les champs requis.', 'warning');
            return;
        }

        const fieldResults: FieldResult[] = this.mapToFieldResults();

        const result: DiligenceFormResult = {
            formConfigId: this.formConfig!.id!,
            clientId: this.selectedClient?.id,
            creationDate: new Date(),
            lastUpdateDate: new Date(),
            fieldResults: fieldResults
        };

        this.formResultService.create(result).subscribe({
            next: (createdResult) => {
                this.updateAssignmentStatus(createdResult);
                this.alertService.displayMessage('Succès', 'Formulaire soumis avec succès', 'success');
                // Optional: Navigate back to client details if we have a client, otherwise list
                // For now, keep existing behavior but maybe improve later
                if (this.selectedClient) {
                    this.navigationService.navigateToClientDiligenceResults(this.selectedClient.id!);
                } else {
                    this.navigationService.navigateToFormConfigList();
                }
            },
            error: (err) => {
                console.error('Error saving result', err);
                this.alertService.displayMessage('Erreur', 'Erreur lors de l\'enregistrement', 'error');
            }
        });
    }

    private updateAssignmentStatus(result: DiligenceFormResult) {
        if (this.selectedClient?.id && this.formConfig?.id) {
            this.statusService.findByClientId(this.selectedClient.id).subscribe(statuses => {
                const assignment = statuses.find(s => s.formConfigId === this.formConfig?.id && s.status === 'PENDING');
                if (assignment) {
                    assignment.status = 'SUBMITTED';
                    assignment.resultId = result.id;
                    this.statusService.update(assignment.id, assignment).subscribe({
                        error: (err) => console.error('Error updating assignment status', err)
                    });
                }
            });
        }
    }

    private mapToFieldResults(): FieldResult[] {
        const results: FieldResult[] = [];
        const formValue = this.diligenceForm.value;

        if (!this.formConfig) return [];

        this.formConfig.fields.forEach(field => {
            if (field.id && formValue.hasOwnProperty(field.id)) {
                // Handle standard fields (text, textarea, select, radio)
                results.push({
                    fieldConfigId: field.id,
                    value: formValue[field.id]
                });
            } else if (field.type === 'checkbox' && field.options) {
                // Handle checkboxes (multiple options)
                field.options.forEach(opt => {
                    if (opt.id && formValue.hasOwnProperty(opt.id)) {
                        results.push({
                            fieldConfigId: field.id!,
                            fieldOptionId: opt.id,
                            value: formValue[opt.id]
                        });
                    }
                });
            }
        });

        return results;
    }
}
