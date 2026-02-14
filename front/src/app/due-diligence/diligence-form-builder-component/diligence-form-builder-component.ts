import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NewDiligenceField } from "../new-diligence-field/new-diligence-field";
import { UtilsService } from '../../services/utils-service';
import { Client, FieldConfig, FormConfig, FormType } from '../../appTypes';
import { ActivatedRoute } from '@angular/router';
import { ClientService } from '../../services/client-service';
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
  activatedRoute = inject(ActivatedRoute);
  clientService = inject(ClientService);
  alertService = inject(AlertService);
  navigationService = inject(NavigationService);
  formService = inject(FormConfigService);
  selectedClient: Client | null = null;
  showDialog = false;
  formFields: FieldConfig[] = [];


  ngOnInit(): void {


    this.activatedRoute.paramMap.subscribe(params => {
      const id = params.get("id");
      if (id) {
        this.getClient(id);
      } else {
        this.alertService.displayMessage("Erreur", "Aucun client trouvé", "error");
        this.navigationService.navigateToClients();
      }
    });

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

  }

  private getClient(id: string) {
    if (id) {
      this.clientService.findById(id).subscribe({
        next: (client) => {
          this.selectedClient = client;
        },
        error: (error) => {
          this.alertService.displayMessage("Erreur", "Aucun client trouvé", "error");
          this.navigationService.navigateToClients();
        }
      });
    }
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

    // if (this.diligenceForm.invalid) {
    //   this.diligenceForm.markAllAsTouched();
    //   alert('Veuillez vérifier les champs du formulaire.');
    //   return;
    // }

    const formConfig: FormConfig = {
      ...this.configForm.value,
      clientId: this.selectedClient?.id,
      fields: this.formFields,
      creationDate: new Date(),
      lastUpdateDate: new Date()
    };

    this.formService.create(formConfig).subscribe({
      next: (response) => {
        this.alertService.displayMessage("Succès", "Formulaire créé avec succès", "success");
        this.navigationService.navigateToFormConfigList();
      },
      error: (error) => {
        this.alertService.displayMessage("Erreur", "Erreur lors de la création du formulaire", "error");
      }
    });

    console.log('Form Configuration:', formConfig);
    console.log('Form Values:', this.diligenceForm.value);

    alert('Form submitted! Check console for values.');
  }


}
