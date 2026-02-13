import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AmlFormConfig, AmlFormResult, AmlInputConfig, AMLInputOption, AmlInputValue, Client, FieldScore } from '../../appTypes';
import { AmlFormConfigService } from '../../services/AmlFormConfigService';
import { AlertService } from '../../services/alert-service';
import { AmlFormResultService } from '../../services/aml-form-result-result-service';

import { MappingFormService } from '../../services/mapping-form-service';
import { NavigationService } from '../../services/navigation-service';
import { ClientService } from '../../services/client-service';

@Component({
  selector: 'app-aml-form-view-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './aml-form-view-component.html',
  styleUrl: './aml-form-view-component.css',
})
export class AmlFormViewComponent implements OnInit {

  @Input() formConfigId: string | number | null = null;
  @Input() clientIdInput: string | null = null;
  @Input() client: Client | null = null;

  activatedRoute = inject(ActivatedRoute);
  amlFormConfigService = inject(AmlFormConfigService);
  amlPageConfigResultService = inject(AmlFormResultService);
  alertService = inject(AlertService);
  navigationServcie = inject(NavigationService);
  clientService = inject(ClientService);


  mappingFormService = inject(MappingFormService);
  fb = inject(FormBuilder);
  selectedFormConfig: AmlFormConfig | null = null;
  availableFormConfigs: AmlFormConfig[] = [];
  clientFormConfigs: AmlFormConfig[] = [];
  dynamicForm: FormGroup;
  totalRiskScore: number = 0;
  fieldScores: FieldScore[] = [];
  AmlInpuConfigs: AmlInputConfig[] = [];
  clientId: string | number | null = null;



  private loadClientFromPath() {
    // teh start part , loading client id from the link parameter
    this.activatedRoute.paramMap.subscribe(params => {
      this.clientId = params.get("clientId");
      //load the client from the db 
      this.loadClient(this.clientId ?? "");

    });


  }

  private loadClient(clientId: string) {
    this.clientService.findById(clientId).subscribe(client => {
      if (client == undefined) {
        console.log("no client found with id " + clientId);
        this.navigationServcie.navigateToClients();
      } else {
        this.client = client;
        this.loadFomrConfigByclient(client);
      }
    });
  }


  private loadFomrConfigByclient(client: Client) {
    this.mappingFormService.findMappingByClientTypeAndSector(client.type, client.secteurActivite).subscribe(configs => {
      this.clientFormConfigs = configs;
    });
  }




  constructor() {
    this.dynamicForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.initComponent();
  }


  private initComponent(): void {
    if (this.client) {
      this.loadAvailableConfigs();
    }

    if (this.formConfigId) {
      if (this.clientIdInput) {
        this.clientId = this.clientIdInput;
      }
      this.loadFormConfig(this.formConfigId);
    } else {
      this.loadPageConfig();
    }
  }

  private loadAvailableConfigs(): void {
    if (!this.client) return;

    // Determine the sector or type for mapping
    // Note: This logic mirrors what might be in the backend or service, using 'secteurActivite' field
    const sectorOrType = this.client.secteurActivite || '';

    this.mappingFormService.findMappingByClientTypeAndSector(this.client.type, sectorOrType).subscribe({
      next: (configs) => {
        this.availableFormConfigs = configs;

        // If no specific form ID is provided, or if we want to ensure we're showing *one* of them
        // we could auto-select here. But typically initComponent handles the initial selection via formConfigId.
        // However, if formConfigId is null, we might want to select the first available one as a fallback?
        if (!this.formConfigId && !this.selectedFormConfig && configs.length > 0) {
          this.loadFormConfig(configs[0].id);
        }
      },
      error: (err) => console.error('Error loading available configs', err)
    });
  }

  onConfigChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const configId = selectElement.value;
    if (configId) {
      this.loadFormConfig(configId);
    }
  }


  private loadPageConfig(): void {
    this.activatedRoute.paramMap.subscribe(params => {
      const configId = params.get("id");
      // Check query params for optional clientId context
      this.clientId = this.activatedRoute.snapshot.queryParamMap.get('clientId');

      if (configId) {
        this.loadFormConfig(configId);
      } else {
        // Only show error if we are NOT waiting for input
        // BUT if we have client and available configs, configId might be null initially?
        // Let's rely on initComponent logic.
        if (!this.formConfigId && !this.client) {
          // Wait, if client is present, we might be loading async.
          // But existing logic shows error immediately if no ID.
          // Let's keep it safe.
          if (!this.availableFormConfigs.length)
            this.alertService.displayMessage('Erreur', 'Aucun ID de configuration fourni.', 'error');
        }
      }
    });
  }

  private loadFormConfig(configId: number | any) {
    if (!configId) return;
    this.amlFormConfigService.findById(configId).subscribe(data => {
      this.selectedFormConfig = data;
      this.AmlInpuConfigs = this.selectedFormConfig.inputConfigs;
      // Reconstruire le formulaire dynamique avec la nouvelle configuration
      this.buildDynamicForm();
      this.subscribeToFormChanges();
    });
  }
  // Construction dynamique des FormControls
  private buildDynamicForm(): void {
    this.dynamicForm = this.fb.group({}); // Reset form
    this.AmlInpuConfigs.forEach(config => {
      const validators = config.required ? [Validators.required] : [];

      if (config.type === 'uploadFile') {
        this.dynamicForm.addControl(config.name, this.fb.control(null, validators));
      } else if (config.type === 'select') {
        this.dynamicForm.addControl(config.name, this.fb.control(null, validators));
        // Pour les types avec options, on peut ajouter des validateurs spécifiques si nécessaire
      } else if (config.type === 'checkbox') {
        let subFormForSelect = this.fb.group({});
        config.options?.forEach(option => {
          const controlName = option.id || '';
          subFormForSelect.addControl(controlName, this.fb.control(false));
        });
        this.dynamicForm.addControl(config.name, subFormForSelect);

      } else if (config.type === 'radio') {
        this.dynamicForm.addControl(config.name, this.fb.control(
          config.defaultValue || '', // Utilisation de defaultValue s'il est fourni
          validators
        ));
      }
    });
    this.subscribeToFormChanges(); // Re-subscribe after rebuild
  }

  // Abonnement aux changements pour déclencher le scoring
  private subscribeToFormChanges(): void {
    this.dynamicForm.valueChanges.subscribe(values => {
      this.calculateRiskScore2();
    });
    // Calcul initial
    this.calculateRiskScore2();
  }

  private calculateRiskScore2(): void {
    let score = 0;
    this.AmlInpuConfigs.forEach(config => {
      // case input upload file
      if (config.type === 'uploadFile') {
        let fileName = this.dynamicForm.get(config.name)?.value;
        if (fileName == '' || fileName == null || fileName == undefined) {
          score += (config.score || 0 * config.facteur) || 0;
        }
      }
      // case type select
      if (config.type === 'select') {
        if (this.dynamicForm.get(config.name)?.value != null) {
          let fieldValue: AMLInputOption = this.dynamicForm.get(config.name)?.value;
          score += (fieldValue.score * config.facteur);
        }
      }
      //case type checkbox
      if (config.type === 'checkbox') {
        let subFormGroup = this.dynamicForm.get(config.name) as FormGroup;
        // alert(JSON.stringify(subFormGroup.value));
        // alert(JSON.stringify(config.options));
        config.options?.forEach(option => {
          let isChecked = subFormGroup.get(option.id || '')?.value;
          if (isChecked) {
            score += (option.score * config.facteur);
          }
        });
      }

      //case radio
      if (config.type === 'radio') {
        let fieldValue = this.dynamicForm.get(config.name)?.value;
        if (fieldValue != null && fieldValue != undefined && fieldValue != '') {
          let selectedOption = config.options?.find(opt => opt.value === fieldValue);
          if (selectedOption) {
            score += (selectedOption.score * config.facteur);
          }
        }
      }
    });
    this.totalRiskScore = score;
  }

  // Méthode utilitaire pour accéder à la configuration
  getFieldConfig(name: string): AmlInputConfig | undefined {
    return this.AmlInpuConfigs.find(c => c.name === name);
  }

  // Gestion de l'upload (met le nom du fichier comme valeur du FormControl)
  handleFileUpload(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.dynamicForm.get(controlName)?.setValue(input.files[0].name);
    } else {
      this.dynamicForm.get(controlName)?.setValue('');
    }
  }

  //compare two option object used in select form
  compareOptionObjects(object1: AMLInputOption | null, object2: AMLInputOption | null): boolean {
    // Compare based on a unique identifier (like 'id')
    return object1 && object2 ? object1.id === object2.id : object1 === object2;
  }


  onSubmit(): void {
    if (this.dynamicForm.valid) {

      this.alertService.confirmMessage("Confirmation de soumission", "Êtes-vous sûr de vouloir soumettre le formulaire ?", 'question').then(confirmed => {
        if (confirmed) {
          this.saveFormValues();
        }
      });
    }
  }

  private saveFormValues(): void {
    let error = false;
    //TODO add efter params to identify the user who submit the form
    const amlPageConfigResult = this.convertFomValueToAmlPageConfigValues();

    this.amlPageConfigResultService.create(amlPageConfigResult).subscribe({
      next: (response) => {
        this.alertService.displayMessage("Succès", "Le formulaire a été soumis avec succès !", 'success');
        this.navigationServcie.navigateToClients();
      },
      error: (err) => {
        error = true;
      }
    });

    if (error) {
      this.alertService.displayMessage("error", "error d envoie du formulaire , contacter le support  !", 'error');
    }

  }

  goBack(): void {
    this.navigationServcie.navigateToClients();
  }

  isFormValid(): boolean {
    let isValid = true;
    this.selectedFormConfig?.inputConfigs.forEach(config => {
      const control = this.dynamicForm.get(config.name);
      if (config.required) {
        if (config.type === 'checkbox') {
          const subFormGroup = control as FormGroup;
          let isSubFormValid = false;
          config.options?.forEach(option => {
            if (subFormGroup.get(option.id || '')?.value === true) {
              isSubFormValid = true;
            }
          });
          if (!isSubFormValid) {
            isValid = false;
          }
        } else {
          if (control?.invalid) {
            isValid = false;
          }
        }
      }
    });
    return isValid;
  }


  private convertFomValueToAmlPageConfigValues(): AmlFormResult {
    const amlPageConfigValues: AmlInputValue[] = [];
    this.AmlInpuConfigs.forEach(config => {
      if (config.type === 'checkbox') {
        const subFormGroup = this.dynamicForm.get(config.name);
        config.options?.forEach(option => {
          const isChecked = subFormGroup?.get(option.id || '')?.value;
          if (isChecked) {
            amlPageConfigValues.push({
              amlFormConfig: this.selectedFormConfig?.id,
              InputConfigID: config.id ?? '',
              value: option.value || ''
            });
          }
        });

      } else {
        if (config.type === 'select') {
          const selectedOption: AMLInputOption = this.dynamicForm.get(config.name)?.value;
          amlPageConfigValues.push({
            amlFormConfig: this.selectedFormConfig?.id,
            InputConfigID: config.id || '',
            value: selectedOption.value || ''
          });
        }
        else {
          const controlValue = this.dynamicForm.get(config.name)?.value;
          amlPageConfigValues.push({
            amlFormConfig: this.selectedFormConfig?.id,
            InputConfigID: config.id || '',
            value: controlValue ? controlValue.toString() : ''
          });
        }
      }
    });


    // risklevel tobe calculated and stored in AmlPageConfigResult afterward depending on the totalRiskScore and user config

    let amlPageConfigResult: AmlFormResult = {
      amlFormConfigID: this.selectedFormConfig?.id,
      totalScore: this.totalRiskScore,
      AmlPageConfigValues: amlPageConfigValues,
      clientId: this.clientId?.toString()
    }


    return amlPageConfigResult;
  }

}
