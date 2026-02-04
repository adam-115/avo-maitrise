import { Component, inject, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AmlFormConfigService } from '../../services/AmlFormConfigService';
import { AlertService } from '../../services/alert-service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AmlFormConfig, AmlFormResult, AmlInputConfig, AMLInputOption, AmlInputValue, FieldScore } from '../../appTypes';
import { AmlFormResultService } from '../../services/aml-form-result-result-service';
import { CommonModule } from '@angular/common';

import { MappingFormService } from '../../services/mapping-form-service';

@Component({
  selector: 'app-aml-form-view-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './aml-form-view-component.html',
  styleUrl: './aml-form-view-component.css',
})
export class AmlFormViewComponent implements OnInit, OnChanges {

  @Input() formConfigId: string | number | null = null;
  @Input() clientIdInput: string | null = null;

  activatedRoute = inject(ActivatedRoute);
  amlFormConfigService = inject(AmlFormConfigService);
  amlPageConfigResultService = inject(AmlFormResultService);
  alertService = inject(AlertService);

  mappingFormService = inject(MappingFormService);
  fb = inject(FormBuilder);
  selectedFormConfig: AmlFormConfig | null = null;
  dynamicForm: FormGroup;
  totalRiskScore: number = 0;
  fieldScores: FieldScore[] = [];
  AmlInpuConfigs: AmlInputConfig[] = [];
  clientId: string | number | null = null;




  constructor() {
    this.dynamicForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.initComponent();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formConfigId'] || changes['clientIdInput']) {
      this.initComponent();
    }
  }

  private initComponent(): void {
    if (this.formConfigId) {
      if (this.clientIdInput) {
        this.clientId = this.clientIdInput;
      }
      this.loadFormConfig(this.formConfigId);
    } else {
      this.loadPageConfig();
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
        if (!this.formConfigId) {
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
    window.history.back();
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
