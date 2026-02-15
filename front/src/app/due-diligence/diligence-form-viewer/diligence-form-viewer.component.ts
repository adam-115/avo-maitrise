import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FieldConfig, FormConfig } from '../../appTypes';
import { AlertService } from '../../services/alert-service';
import { FormConfigService } from '../../services/form-config-service';
import { NavigationService } from '../../services/navigation-service';

@Component({
    selector: 'app-diligence-form-viewer',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './diligence-form-viewer.component.html',
})
export class DiligenceFormViewerComponent implements OnInit {
    formConfig: FormConfig | null = null;
    diligenceForm: FormGroup = new FormGroup({});

    private route = inject(ActivatedRoute);
    private fb = inject(FormBuilder);
    private formConfigService = inject(FormConfigService);
    private alertService = inject(AlertService);
    private navigationService = inject(NavigationService);

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

        console.log('Form Values:', this.diligenceForm.value);
        this.alertService.displayMessage('Succès', 'Formulaire soumis avec succès (voir console)', 'success');
        // Implement actual submission logic here
    }
}
