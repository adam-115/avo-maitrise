import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Client, DiligenceFormResult, FieldConfig, FieldResult, FormConfig } from '../../appTypes';
import { AlertService } from '../../services/alert-service';
import { FormConfigService } from '../../services/form-config-service';
import { NavigationService } from '../../services/navigation-service';
import { ClientService } from '../../services/client-service';
import { FormResultService } from '../../services/form-result-service';

@Component({
    selector: 'app-diligence-form-viewer',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
    templateUrl: './diligence-form-viewer.component.html',
})
export class DiligenceFormViewerComponent implements OnInit {
    formConfig: FormConfig | null = null;
    diligenceForm: FormGroup = new FormGroup({});
    selectedClient: Client | null = null;
    targetUboId: number | undefined = undefined;
    selectedFileNames: { [fieldId: string]: string } = {};
    selectedFileSizes: { [fieldId: string]: string } = {};
    isSubmitting = false;

    private route = inject(ActivatedRoute);
    private fb = inject(FormBuilder);
    private formConfigService = inject(FormConfigService);
    private alertService = inject(AlertService);
    private navigationService = inject(NavigationService);
    private clientService = inject(ClientService);
    private formResultService = inject(FormResultService);

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.loadFormConfig(id);
            } else {
                this.alertService.displayMessage('Erreur', 'Identifiant du formulaire manquant', 'error');
            }
        });

        // Get clientId and uboId from query params
        this.route.queryParams.subscribe(params => {
            const clientId = params['clientId'];
            if (clientId) {
                this.loadClient(clientId);
            }
            if (params['uboId']) {
                this.targetUboId = Number(params['uboId']);
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

        // case text or textarea or number
        if (field.type === 'text' || field.type === 'textarea' || field.type === 'number') {
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

        if (field.type === 'checkbox') {
            const options = field.options || [];
            options.forEach(option => {
                const control = field.required
                    ? this.fb.control(false, Validators.requiredTrue)
                    : this.fb.control(false);
                this.diligenceForm.addControl(option.id!, control);
            });
        }

        if (field.type === 'file') {
            const control = field.required
                ? this.fb.control(null, Validators.required)
                : this.fb.control(null);
            this.diligenceForm.addControl(field.id, control);
        }
    }

    onFileChange(event: any, fieldId: string) {
        const file = event.target.files[0];
        if (file) {
            this.selectedFileNames[fieldId] = file.name;
            const kb = file.size / 1024;
            this.selectedFileSizes[fieldId] = kb >= 1024 ? `${(kb / 1024).toFixed(1)} Mo` : `${Math.round(kb)} Ko`;

            const reader = new FileReader();
            reader.onload = () => {
                const payload = JSON.stringify({
                    name: file.name,
                    data: reader.result,
                    size: file.size,
                    type: file.type
                });
                this.diligenceForm.patchValue({
                    [fieldId]: payload
                });
                this.diligenceForm.get(fieldId)?.markAsTouched();
            };
            reader.readAsDataURL(file);
        }
    }

    removeFile(fieldId: string, event?: Event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        delete this.selectedFileNames[fieldId];
        delete this.selectedFileSizes[fieldId];
        this.diligenceForm.patchValue({
            [fieldId]: null
        });
        this.diligenceForm.get(fieldId)?.markAsTouched();
    }

    getSelectedFileName(fieldId: string): string | null {
        return this.selectedFileNames[fieldId] || null;
    }

    getSelectedFileSize(fieldId: string): string | null {
        return this.selectedFileSizes[fieldId] || null;
    }

    getSelectedFileExt(fieldId: string): string {
        const name = this.selectedFileNames[fieldId];
        return name ? (name.split('.').pop()?.toUpperCase() || 'FILE') : 'FILE';
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
        return this.isCompany(client) ? 'FORM_VIEWER.TYPE_COMPANY' : 'FORM_VIEWER.TYPE_INDIVIDUAL';
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

    getTotalFieldsCount(): number {
        return this.formConfig?.fields?.length || 0;
    }

    getFilledFieldsCount(): number {
        if (!this.formConfig?.fields) return 0;
        let count = 0;
        this.formConfig.fields.forEach(field => {
            if (field.type === 'checkbox') {
                const anyChecked = (field.options || []).some(opt => this.diligenceForm.get(opt.id!)?.value === true);
                if (anyChecked) count++;
            } else if (field.id) {
                const val = this.diligenceForm.get(field.id)?.value;
                if (val !== null && val !== undefined && String(val).trim() !== '') {
                    count++;
                }
            }
        });
        return count;
    }

    getCompletionPercentage(): number {
        const total = this.getTotalFieldsCount();
        if (total === 0) return 0;
        return Math.round((this.getFilledFieldsCount() / total) * 100);
    }

    goBack() {
        if (this.selectedClient) {
            this.navigationService.navigateToClientDiligenceResults(String(this.selectedClient.id!));
        } else {
            this.navigationService.navigateToClients();
        }
    }

    onSubmit() {
        if (this.diligenceForm.invalid) {
            this.diligenceForm.markAllAsTouched();
            this.alertService.displayMessage('Attention', 'Veuillez remplir correctement tous les champs requis.', 'warning');
            return;
        }

        this.isSubmitting = true;
        const fieldResults: FieldResult[] = this.mapToFieldResults();

        const result: DiligenceFormResult = {
            formConfigId: this.formConfig!.id!,
            clientId: this.selectedClient?.id as number,
            uboId: this.targetUboId,
            creationDate: new Date().toISOString(),
            lastUpdateDate: new Date().toISOString(),
            fieldResults: fieldResults
        };

        this.formResultService.create(result).subscribe({
            next: (createdResult) => {
                this.isSubmitting = false;
                this.alertService.displayMessage('Succès', 'Formulaire soumis avec succès', 'success');
                if (this.selectedClient) {
                    this.navigationService.navigateToClientDiligenceResults(String(this.selectedClient.id!));
                }
            },
            error: (err) => {
                console.error('Error saving result', err);
                this.isSubmitting = false;
                this.alertService.displayMessage('Erreur', 'Erreur lors de l\'enregistrement', 'error');
            }
        });
    }

    private mapToFieldResults(): FieldResult[] {
        const results: FieldResult[] = [];
        const formValue = this.diligenceForm.value;

        if (!this.formConfig) return [];

        this.formConfig.fields.forEach(field => {
            if (field.id && formValue.hasOwnProperty(field.id)) {
                // Handle standard fields (text, textarea, select, radio, file)
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
