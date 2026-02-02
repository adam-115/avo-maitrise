import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from '../../services/alert-service';
import { AmlFormConfigService } from '../../services/AmlFormConfigService';
import { MappingFormService } from '../../services/mapping-form-service';
import { NavigationService } from '../../services/navigation-service';
import { SecteurActiviteService } from './../../services/secteur-activite-service';
import { TypeClientService } from '../../services/type-client-service';
import { UtilsService } from '../../services/utils-service';
import { AmlInputConfigComponent } from "../aml-input-config-component/aml-input-config";
import { AmlFormConfig, AmlInputConfig, MappingForm, SecteurActivite, TypeClient } from '../../appTypes';

@Component({
  selector: 'app-aml-form-config-component',
  imports: [ReactiveFormsModule, AmlInputConfigComponent],
  templateUrl: './aml-form-config-component.html',
  styleUrl: './aml-form-config-component.css',
})
export class AmlFormConfigComponent implements OnInit {

  // service injection
  amlFormConfigService = inject(AmlFormConfigService);
  navigationService = inject(NavigationService);
  alertService = inject(AlertService);
  activatedRoute = inject(ActivatedRoute);
  utilsService = inject(UtilsService);
  secteurActiviteService = inject(SecteurActiviteService);
  typeClientService = inject(TypeClientService);
  mappingFormService = inject(MappingFormService);

  amlInputConfigs: AmlInputConfig[] = [];
  secteurs: SecteurActivite[] = [];
  typeClients: TypeClient[] = [];
  // if is on edit mode
  isEditeMode = false;
  editedFormConfig: AmlFormConfig | null = null;
  selectedAmlInputConfig: AmlInputConfig | null = null;
  showDialogNewInputAmlConfig = false;

  // showDialogPreview: boolean = false;


  amlPagePreviewConfig: AmlFormConfig | null = null;
  pageForm: FormGroup = new FormGroup({});

  // Initialisation de l'objet selon votre interface AmlPageConfig
  pageConfig: AmlFormConfig = {
    formName: '',
    formTitle: '',
    formDescription: '',
    inputConfigs: [],
    order: 1,
  };

  constructor(private readonly fb: FormBuilder) { }
  ngOnInit(): void {
    // build dynamic form
    this.buildForm();
    // check if is update a init data if the case
    this.isItUpdateMode();
    this.loadSecteurs();
    this.loadTypeClients();
  }

  // load config to update
  private isItUpdateMode(): void {

    this.activatedRoute.paramMap.subscribe(params => {
      const id = params.get("id");
      this.isEditeMode = !!id;
      if (this.isEditeMode) {
        this.amlFormConfigService.findById(id).subscribe(data => {
          this.editedFormConfig = data;
          this.initializeFormWithAmlPageConfig(this.editedFormConfig);
        });
        // Charger le mapping existant
        this.mappingFormService.getAll().subscribe(mappings => {
          const mapping = mappings.find(m => String(m.amlFormConfigID) === String(id));
          if (mapping) {
            this.pageForm.patchValue({
              typeClient: mapping.typeClient,
              secteurActivite: mapping.secteurActivite
            });
          }
        });
      }
    });
  }

  // build dynamic form for the page
  private buildForm(): void {
    this.pageForm = this.fb.group({
      pageName: [{ value: this.utilsService.generateTimestampId(), disabled: true }, Validators.required],
      pageTitle: [this.pageConfig.formTitle, Validators.required],
      pageDescription: [this.pageConfig.formDescription],
      // Nouveaux champs pour le Mapping
      typeClient: ["PERSONNE", Validators.required],
      secteurActivite: ["TOUT", Validators.required]

    });
  }

  private loadSecteurs() {
    this.secteurActiviteService.getAll().subscribe(data => {
      this.secteurs = data.filter(s => s.actif);
    });
  }

  private loadTypeClients() {
    this.typeClientService.getAll().subscribe(data => {
      this.typeClients = data.filter(t => t.actif);
    });
  }

  openInputFieldDialogForEdit(inputTypeConfig: AmlInputConfig): void {
    this.selectedAmlInputConfig = inputTypeConfig;
    this.showDialogNewInputAmlConfig = true;
  }

  // SAUVEGARDE GLOBALE DE LA PAGE
  private saveNewPage(): void {
    if (this.pageForm.valid && this.amlInputConfigs.length > 0) {
      this.pageConfig = this.convertFormToAmlPageConfig();
      this.generateIdsForMultipleOptions(this.pageConfig);
      this.alertService.confirmMessage("Ajout Nouvelle Page ", "Voullez-vous ajouter la page", 'question').then(result => {
        if (result) {
          this.amlFormConfigService.create(this.pageConfig).subscribe({
            next: (response) => {
              // Créer le mapping
              const mapping: MappingForm = {
                typeClient: this.pageForm.get('typeClient')?.value,
                secteurActivite: this.pageForm.get('secteurActivite')?.value,
                amlFormConfigID: response.id!
              };
              this.mappingFormService.create(mapping).subscribe(() => {
                this.alertService.displayMessage("nouvelle page ", "la nouvelle page est bien ajouter ", 'success');
                this.navigationService.navigateToFormConfigList();
              });
            },
            error: (err) => {
              this.alertService.displayMessage("Error... ", "Error ajout de la page merci de contacter le support ", 'error');
            }
          });
        }
      })
    }
  }

  private editNewPage(): void {
    if (this.pageForm.valid && this.amlInputConfigs.length > 0) {
      this.pageConfig = this.convertFormToAmlPageConfig();
      this.pageConfig.id = this.editedFormConfig?.id;

      this.alertService.confirmMessage("Updtae Page ", "Voullez-vous mettre a jour la page " + this.pageConfig.formName, 'question').then(result => {
        if (result) {
          this.amlFormConfigService.update(this.editedFormConfig?.id, this.pageConfig).subscribe({
            next: (response) => {
              // Mettre à jour le mapping
              this.mappingFormService.getAll().subscribe(mappings => {
                const existingMapping = mappings.find(m => m.amlFormConfigID == this.editedFormConfig?.id);
                const newMappingData = {
                  typeClient: this.pageForm.get('typeClient')?.value,
                  secteurActivite: this.pageForm.get('secteurActivite')?.value,
                  amlFormConfigID: this.editedFormConfig!.id!
                };

                if (existingMapping) {
                  this.mappingFormService.update(existingMapping.id, newMappingData).subscribe(() => {
                    this.alertService.displayMessage("Page mis  a jour  ", "la nouvelle page est bien ajouter ", 'success');
                    this.navigationService.navigateToFormConfigList();
                  });
                } else {
                  this.mappingFormService.create(newMappingData).subscribe(() => {
                    this.alertService.displayMessage("Page mis  a jour  ", "la nouvelle page est bien ajouter ", 'success');
                    this.navigationService.navigateToFormConfigList();
                  });
                }
              });
            },
            error: (err) => {
              this.alertService.displayMessage("Error... ", "Error de la mise a jour de la page, merci de contacter le support ", 'error');
            }
          });
        }
      })
    }
  }




  private isInputTypeConfigExist(name: string): boolean {
    return this.amlInputConfigs.some(config => config.name === name);
  }

  private generateIdsForMultipleOptions(AmlPageConfig: AmlFormConfig) {
    AmlPageConfig.inputConfigs.forEach(inputTypeConfig => {
      inputTypeConfig.id = inputTypeConfig.id || this.utilsService.generateTimestampId();
      if (inputTypeConfig.options && inputTypeConfig.options.length > 0) {
        inputTypeConfig.options.forEach(option => {
          if (!option.id) {
            option.id = this.utilsService.generateTimestampId();
          }
        });
      }
    });
  }
  OnDeleteInputTypeConfigDialo(toDeleteInputTypeConfig: AmlInputConfig): void {
    this.alertService.confirmMessage("suppression Input type config ", "voullez-vous supprimez " + toDeleteInputTypeConfig.name, 'warning').then(result => {
      if (result) {
        this.deleteInputTypeConfig(toDeleteInputTypeConfig.name);
        this.alertService.displayMessage("New InputType Config", "the input with name " + toDeleteInputTypeConfig.name + " is deleted .", "success")
      }
    })

  }



  private deleteInputTypeConfig(name: string): void {
    const index = this.amlInputConfigs.findIndex(config => config.name === name);
    if (index !== -1) {
      this.amlInputConfigs.splice(index, 1);
      this.pageConfig.inputConfigs = [...this.amlInputConfigs];
    }
  }



  Onsubmit(): void {
    if (this.isEditeMode) {
      this.editNewPage();
    } else {
      this.saveNewPage();
    }
  }


  // In your component class
  private convertFormToAmlPageConfig(): AmlFormConfig {
    const formValue = this.pageForm.getRawValue(); // Use getRawValue() to get all values including disabled controls
    const amlPageConfig: AmlFormConfig = {
      formName: formValue.pageName,
      formTitle: formValue.pageTitle,
      formDescription: formValue.pageDescription || '', // Handle optional field
      order: 0, // removed from UI, default to 0
      inputConfigs: this.amlInputConfigs,
    };

    return amlPageConfig;
  }

  annuler(): void {
    this.navigationService.navigateToFormConfigList();
  }

  // openPreviewDialog(): void {
  //   this.amlPagePreviewConfig = this.convertFormToAmlPageConfig();
  //   this.showDialogPreview = true;
  // }

  // closePreviewDialog(): void {
  //   this.showDialogPreview = false;
  // }

  // Initialize form when creating component or loading data
  private initializeFormWithAmlPageConfig(pageConfig: AmlFormConfig): void {
    this.pageForm.patchValue({
      pageName: pageConfig.formName || '',
      pageTitle: pageConfig.formTitle || '',
      pageDescription: pageConfig.formDescription || ''
    });
    this.amlInputConfigs = pageConfig.inputConfigs;
  }



  // add or update new field config
  openInputFieldConfigDialog(): void {
    this.showDialogNewInputAmlConfig = true;
  }

  closeInputFieldConfigDialog(): void {
    this.selectedAmlInputConfig = null;
    this.showDialogNewInputAmlConfig = false;
  }

  addInputTypeConfig(inputTypeConfig: any): void {

    inputTypeConfig = inputTypeConfig as AmlInputConfig;
    // check if the field already exists (update) or is new (add)
    if (this.isInputTypeConfigExist(inputTypeConfig.name)) {
      this.alertService.displayMessage("Ajout Input type config ", "input type config existe deja avec le meme nom : " + inputTypeConfig.name, "error");
    } else {
      this.amlInputConfigs.push(inputTypeConfig);
      this.pageConfig.inputConfigs = [...this.amlInputConfigs];
    }
    this.closeInputFieldConfigDialog();
  }

  updateInputTypeConfig(updatedConfig: AmlInputConfig): void {
    if (!this.selectedAmlInputConfig) {
      return;
    }
    const index = this.amlInputConfigs.findIndex(config => config.name === this.selectedAmlInputConfig!.name);
    if (index !== -1) {
      this.amlInputConfigs[index] = updatedConfig;
      this.pageConfig.inputConfigs = [...this.amlInputConfigs];
    }
    this.closeInputFieldConfigDialog();
  }


}
