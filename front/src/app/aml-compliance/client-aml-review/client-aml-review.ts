import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AmlFormConfig, AmlFormResult, AmlInputConfig, AMLInputOption, AmlInputValue, Client, FieldScore } from '../../appTypes';
import { AlertService } from '../../services/alert-service';
import { ClientService } from '../../services/client-service';
import { MappingFormService } from '../../services/mapping-form-service';
import { NavigationService } from '../../services/navigation-service';
import { AmlFormResultService } from '../../services/aml-form-result-result-service';

@Component({
  selector: 'app-client-aml-review',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './client-aml-review.html',
  styleUrl: './client-aml-review.css',
})
export class ClientAmlReview implements OnInit {

  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly clientService = inject(ClientService);
  private readonly mappingFormService = inject(MappingFormService);
  private readonly navigationService = inject(NavigationService);
  private readonly amlResultService = inject(AmlFormResultService);
  private readonly alertService = inject(AlertService);
  private readonly fb = inject(FormBuilder);


  dynamicForm: FormGroup;
  totalRiskScore: number = 0;
  selectedAMlFomConfig: AmlFormConfig | null = null;
  client: Client | null = null;
  clientFormConfigs: AmlFormConfig[] = [];
  fieldScores: FieldScore[] = [];

  constructor() {
    this.dynamicForm = this.fb.group({});
  }

  ngOnInit(): void {
    // the implementation plan : 
    // load client with the id from the path: 
    // load amlformconfig for the client 
    // if many load first or the the order by date 
    this.loadClient();
    // this.loadFormConfigs(this.client!);
  }

  private loadClient(): void {
    this.activatedRoute.paramMap.subscribe({
      next: (params) => {
        let clientId = params.get('id');
        if (clientId) {
          this.clientService.findById(clientId).subscribe({
            next: (client) => {
              this.client = client;
              console.log("client ********** " + JSON.stringify(this.client));
              this.loadFormConfigs(client);

            },
            error: (error) => {
              console.log("no client found with id " + clientId);
              this.navigationService.navigateToClients();
              this.alertService.displayMessage("error", "no client found with id " + clientId, "error");
            }
          });
        }
      }
    });
  }

  private loadFormConfigs(client: Client): void {
    if (!client) {
      console.log("no client found");
      this.navigationService.navigateToClients();
      this.alertService.displayMessage("error", "no client found", "error");
      return;
    }
    this.mappingFormService.findMappingByClientTypeAndSector(client.type, client.secteurActivite).subscribe({
      next: (formConfigs) => {
        console.log("form configs ********** " + JSON.stringify(formConfigs));
        this.clientFormConfigs = formConfigs;
        if (formConfigs.length > 0) {
          // load the first one it will be ordererd by date 
          this.selectedAMlFomConfig = formConfigs[0];
          console.log("selected aml form config ********** " + JSON.stringify(this.selectedAMlFomConfig));
          this.buildDynamicForm();
        }

      },
      error: (error) => {
        console.log("no form config found for client with id " + client.id);
        this.navigationService.navigateToClients();
        this.alertService.displayMessage("error", "no form config found for client with id " + client.id, "error");
      }
    });
  }



  // Abonnement aux changements pour déclencher le scoring
  private subscribeToFormChanges(): void {
    this.dynamicForm.valueChanges.subscribe(values => {
      this.calculateRiskScore();
    });
    // Calcul initial
    this.calculateRiskScore();
  }


  private calculateRiskScore(): void {
    let score = 0;
    this.fieldScores = [];

    this.selectedAMlFomConfig?.inputConfigs.forEach(config => {
      let fieldScore = 0;

      // case input upload file
      if (config.type === 'uploadFile') {
        let fileName = this.dynamicForm.get(config.name)?.value;
        if (fileName == '' || fileName == null || fileName == undefined) {
          fieldScore += ((config.score || 0) * config.facteur) || 0;
        }
      }
      // case type select
      if (config.type === 'select') {
        const value = this.dynamicForm.get(config.name)?.value;
        if (value != null) {
          let fieldValue: AMLInputOption = value;
          fieldScore += (fieldValue.score * config.facteur);
        }
      }
      //case type checkbox
      if (config.type === 'checkbox') {
        let subFormGroup = this.dynamicForm.get(config.name) as FormGroup;
        config.options?.forEach(option => {
          let isChecked = subFormGroup.get(option.id || '')?.value;
          if (isChecked) {
            fieldScore += (option.score * config.facteur);
          }
        });
      }

      //case radio
      if (config.type === 'radio') {
        let fieldValue = this.dynamicForm.get(config.name)?.value;
        if (fieldValue != null && fieldValue != undefined && fieldValue != '') {
          let selectedOption = config.options?.find(opt => opt.value === fieldValue);
          if (selectedOption) {
            fieldScore += (selectedOption.score * config.facteur);
          }
        }
      }

      this.fieldScores.push({
        name: config.name,
        label: config.labelMessage,
        facteur: config.facteur,
        scoreObtenu: fieldScore
      });

      score += fieldScore;
    });
    this.totalRiskScore = score;
  }

  // Construction dynamique des FormControls
  private buildDynamicForm(): void {
    this.dynamicForm = this.fb.group({}); // Reset form
    this.selectedAMlFomConfig?.inputConfigs.forEach(config => {
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

  // Méthode utilitaire pour accéder à la configuration
  getFieldConfig(name: string): AmlInputConfig | undefined {
    return this.selectedAMlFomConfig?.inputConfigs.find(c => c.name === name);
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

    this.amlResultService.create(amlPageConfigResult).subscribe({
      next: (response) => {
        this.alertService.displayMessage("Succès", "Le formulaire a été soumis avec succès !", 'success');
        this.navigationService.navigateToClients();
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
    this.navigationService.navigateToClients();
  }

  isFormValid(): boolean {
    let isValid = true;
    this.selectedAMlFomConfig?.inputConfigs.forEach(config => {
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
    this.selectedAMlFomConfig?.inputConfigs.forEach(config => {
      if (config.type === 'checkbox') {
        const subFormGroup = this.dynamicForm.get(config.name);
        config.options?.forEach(option => {
          const isChecked = subFormGroup?.get(option.id || '')?.value;
          if (isChecked) {
            amlPageConfigValues.push({
              amlFormConfig: this.selectedAMlFomConfig?.id,
              InputConfigID: config.id ?? '',
              value: option.value || ''
            });
          }
        });

      } else {
        if (config.type === 'select') {
          const selectedOption: AMLInputOption = this.dynamicForm.get(config.name)?.value;
          amlPageConfigValues.push({
            amlFormConfig: this.selectedAMlFomConfig?.id,
            InputConfigID: config.id || '',
            value: selectedOption.value || ''
          });
        }
        else {
          const controlValue = this.dynamicForm.get(config.name)?.value;
          amlPageConfigValues.push({
            amlFormConfig: this.selectedAMlFomConfig?.id,
            InputConfigID: config.id || '',
            value: controlValue ? controlValue.toString() : ''
          });
        }
      }
    });

    // risklevel tobe calculated and stored in AmlPageConfigResult afterward depending on the totalRiskScore and user config
    let amlPageConfigResult: AmlFormResult = {
      amlFormConfigID: this.selectedAMlFomConfig?.id,
      totalScore: this.totalRiskScore,
      AmlPageConfigValues: amlPageConfigValues,
      clientId: this.client?.id?.toString()
    }
    return amlPageConfigResult;
  }




}
