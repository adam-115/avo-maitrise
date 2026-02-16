import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NewDiligenceField } from "../new-diligence-field/new-diligence-field";
import { UtilsService } from '../../services/utils-service';
import { FieldConfig, FormConfig, FormType } from '../../appTypes';
import { AlertService } from '../../services/alert-service';
import { NavigationService } from '../../services/navigation-service';
import { FormConfigService } from '../../services/form-config-service';



@Component({
  selector: 'app-diligence-form-builder-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NewDiligenceField],
  templateUrl: './diligence-form-builder-component.html',
  styleUrl: './diligence-form-builder-component.css',
})
export class DiligenceFormBuilderComponent implements OnInit {

  configForm!: FormGroup;
  diligenceForm!: FormGroup;

  // Expose FormType for the template
  FormType = FormType;
  formTypeOptions = Object.values(FormType);
  fb = inject(FormBuilder);
  utilsService = inject(UtilsService);
  alertService = inject(AlertService);
  navigationService = inject(NavigationService);
  formService = inject(FormConfigService);
  route = inject(ActivatedRoute);
  showDialog = false;
  formFields: FieldConfig[] = [];


  ngOnInit(): void {

    const generatedId = this.utilsService.generateTimestampId();
    // Initialize the form configuration form
    this.configForm = this.fb.group({
      id: [{ value: generatedId, disabled: true }],
      name: ['', [Validators.required, Validators.minLength(3)]],
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required]],
      type: [FormType.AML, [Validators.required]]
    });

    // Initialize the fields form (will be dynamic)
    this.diligenceForm = this.fb.group({});

    // Check for edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadForm(id);
    }

  }

  loadForm(id: string) {
    this.formService.findById(id).subscribe({
      next: (config) => {
        if (config) {
          this.configForm.patchValue(config);
          if (config.fields) {
            config.fields.forEach(field => {
              this.formFields.push(field);
              this.createFormControl(field);
            });
          }
        }
      },
      error: (err) => {
        this.alertService.displayMessage("Erreur", "Impossible de charger le formulaire", "error");
        this.navigationService.navigateToDiligenceFormList();
      }
    });
  }


  onAddField(field: FieldConfig) {
    const fieldWithIds = this.generateFieldId(field);
    this.formFields.push(fieldWithIds);
    this.createFormControl(fieldWithIds);
    this.showDialog = false;
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

  private generateFieldId(fied: FieldConfig): FieldConfig {
    fied.id = this.utilsService.generateTimestampId();
    if (fied.options) {
      fied.options.forEach(opt => { opt.id = this.utilsService.generateTimestampId(); });
    }
    return fied;
  }

  onRemoveField(index: number, field: FieldConfig) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce champ ?')) {
      // Remove form controls
      if (field.type === 'checkbox' && field.options) {
        field.options.forEach(opt => {
          if (opt.id) this.diligenceForm.removeControl(opt.id);
        });
      } else {
        if (field.id) this.diligenceForm.removeControl(field.id);
      }

      // Remove from list
      this.formFields.splice(index, 1);
    }
  }

  onSubmit() {
    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      alert('Veuillez remplir les informations du formulaire.');
      return;
    }

    const formConfig: FormConfig = {
      ...this.configForm.value,
      fields: this.formFields,
      creationDate: new Date(),
      lastUpdateDate: new Date()
    };

    console.log('Form Configuration:', formConfig);

    const id = this.configForm.get('id')?.value;
    // If we loaded an existing form, we should likely update it.
    // However, the ID field is disabled. `getRawValue()` might include it.
    // Let's check if we are in edit mode based on route or existing ID in global state?
    // Or just check if `formConfig.id` matches the route param ID.

    const routeId = this.route.snapshot.paramMap.get('id');

    if (routeId) {
      this.formService.update(routeId, formConfig).subscribe({
        next: (response) => {
          this.alertService.displayMessage("Succès", "Formulaire mis à jour avec succès", "success");
          this.navigationService.navigateToDiligenceFormList();
        },
        error: (error) => {
          this.alertService.displayMessage("Erreur", "Erreur lors de la mise à jour du formulaire", "error");
        }
      });
    } else {
      this.formService.create(formConfig).subscribe({
        next: (response) => {
          this.alertService.displayMessage("Succès", "Formulaire créé avec succès", "success");
          this.navigationService.navigateToDiligenceFormList();
        },
        error: (error) => {
          this.alertService.displayMessage("Erreur", "Erreur lors de la création du formulaire", "error");
        }
      });
    }
  }


}
