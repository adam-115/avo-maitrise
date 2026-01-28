import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AmlInputConfig, AMLInputOption, InputType } from '../../appTypes';

// Valeurs initiales par défaut
const initialField: AmlInputConfig = {
  type: 'select',
  name: '',
  facteur: 1,
  required: false,
  labelMessage: '',
};

@Component({
  selector: 'app-aml-field-edit',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './aml-input-config.html',
  styleUrl: './aml-input-config.css',
})
export class AmlInputConfigComponent implements OnInit {

  fb = inject(FormBuilder);

  // for the update
  @Input()
  selectedAmlInputConfig: AmlInputConfig | null = null;

  //events
  @Output()
  save = new EventEmitter<AmlInputConfig>();

  @Output()
  update = new EventEmitter<AmlInputConfig>();

  @Output()
  closed = new EventEmitter<void>();

  amlForm!: FormGroup;
  availableTypes: InputType[] = ['select', 'checkbox', 'radio', 'uploadFile'];
  optionRequiredTypes: InputType[] = ['select', 'checkbox', 'radio'];

  constructor() { }


  ngOnInit(): void {
    if (this.selectedAmlInputConfig) {
      console.log(this.selectedAmlInputConfig);
      this.initForm(this.selectedAmlInputConfig);
    } else {
      this.initForm(initialField);
    }
    // Abonnement pour gérer dynamiquement le FormArray 'options'
    this.amlForm.get('type')?.valueChanges.subscribe((type: InputType) => {
      this.toggleOptionsLogic(type);
    });
  }

  // Initialisation du formulaire réactif
  initForm(config: AmlInputConfig): void {

    // Créer le FormArray 'options' basé sur les données existantes
    const initialOptions: AMLInputOption[] = config.options || [];
    this.amlForm = this.fb.group({
      id: [config.id],
      type: [config.type, Validators.required],
      name: [config.name, Validators.required],
      labelMessage: [config.labelMessage, Validators.required],
      required: [config.required],
      score: [config.score, [Validators.min(0), Validators.max(10)]], // Garder le score ici pour uploadFile
      facteur: [config.facteur, [Validators.required, Validators.min(0)]],
      // REMOVED: score from the main form group
      placeholder: [config.placeholder || ''],
      errorMessage: [config.errorMessage || ''],
      customStyle: [config.customStyle || ''],
      defaultValue: [config.defaultValue],
      optionsLayout: [config.optionsLayout || 'block'],
      options: this.fb.array(this.createOptionFormArray(initialOptions, config.type))
    });

    this.toggleOptionsLogic(config.type);
  }

  // Crée un FormGroup pour une seule option
  createOptionFormGroup(option: AMLInputOption): FormGroup {
    return this.fb.group({
      id: [option.id],
      value: [option.value, Validators.required],
      score: [option.score, [Validators.required, Validators.min(0)]], // Score reste ici
      order: [option.order]
    });
  }

  // Mappe les données initiales en FormGroups
  createOptionFormArray(options: AMLInputOption[], currentType: InputType): FormGroup[] {
    // Si c'est un champ à options et qu'il n'y en a pas, ajouter une option par défaut
    if (this.optionRequiredTypes.includes(currentType) && options.length === 0) {
      return [this.createOptionFormGroup({ value: '', score: 0 })];
    }
    return options.map(opt => this.createOptionFormGroup(opt));
  }


  // Logique pour gérer le champ 'options' (ajouter/retirer le FormArray)
  toggleOptionsLogic(type: InputType): void {
    const optionsArray = this.amlForm.get('options') as FormArray;
    const isOptionsRequired = this.optionRequiredTypes.includes(type);

    if (isOptionsRequired) {
      // S'assurer qu'il y a au moins un élément si le type requiert des options
      if (optionsArray.length === 0) {
        this.addOption();
      }
    } else {
      // Vider le FormArray si le type ne nécessite plus d'options
      optionsArray.clear();
    }
  }


  onSubmit(): void {
    if (this.amlForm.invalid) {
      this.amlForm.markAllAsTouched();
      return;
    }
    const formValue = this.amlForm.value;

    // Construction de l'objet de sortie selon l'interface InputTypeConfig
    const configPayload: AmlInputConfig = {
      id: formValue.id || null,
      type: formValue.type as InputType,
      name: formValue.name,
      labelMessage: formValue.labelMessage,
      facteur: formValue.facteur,
      required: formValue.required,
      placeholder: formValue.placeholder || '',
      errorMessage: formValue.errorMessage || '',
      optionsLayout: formValue.optionsLayout,
      displayOrer: formValue.displayOrer || 0, // Note: respect de votre typo 'displayOrer'
      defaultValue: formValue.defaultValue || null
    };

    // LOGIQUE SPÉCIFIQUE SELON LE TYPE
    if (configPayload.type === 'uploadFile') {
      // Pour l'upload, on utilise le score direct et on s'assure qu'il n'y a pas d'options
      configPayload.score = formValue.score;
      configPayload.options = [];
    } else {
      // Pour select, radio, checkbox, on mappe le FormArray d'options
      configPayload.score = undefined; // Pas de score global si options présentes
      configPayload.options = formValue.options.map((opt: any, index: number) => ({
        id: opt.id || undefined,
        value: opt.value,
        score: opt.score,
        order: index + 1,
        InputTypeConfigId: configPayload.id
      }));
    }
    if (this.selectedAmlInputConfig) {
      this.update.emit(configPayload);
    } else {
      this.save.emit(configPayload);
    }

  }


  onClose(): void {
    this.amlForm.reset();
    this.closed.emit();
  }


  /**
   * @description Simule le traitement d'un fichier CSV/JSON pour ajouter des options.
   * NOTE: Le traitement réel (lecture, parsing du fichier) se ferait dans un service Angular.
   */
  handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Ici, on simule l'ajout d'options basées sur le nom du fichier.
      console.log(`Fichier sélectionné pour importation : ${file.name}`);

      // --- LOGIQUE SIMULÉE CÔTÉ CLIENT (A ADAPTER) ---
      // Si on détecte un fichier, on pourrait vider les options existantes
      // et ajouter des options factices (ou réelles après parsing).
      this.options.clear();

      // Simulation: Ajouter deux options après l'import
      this.options.push(this.createOptionFormGroup({ value: 'Import-A: ' + file.name, score: 5 }));
      this.options.push(this.createOptionFormGroup({ value: 'Import-B: ' + file.name, score: 10 }));

      // Réinitialiser la valeur de l'input pour permettre l'upload du même fichier à nouveau
      input.value = '';

      // alert(`Importation simulée réussie de ${file.name} ! Vérifiez la section "Options" ci-dessous.`);
    }
  }

  // Gère les changements de type pour adapter le formulaire
  onTypeChange(): void {
    const type = this.amlForm.get('type')?.value;
    this.options.clear();
    if (type === 'radio') {
      // Forcer deux options : Oui et Non
      this.addOption('Oui', 0);
      this.addOption('Non', 0);
    } else if (type === 'select' || type === 'checkbox') {
      this.addOption(); // Ajouter une option vide par défaut
    }
    // Pour uploadFile, on ne touche pas aux options (elles restent vides)
  }

  patchForm(config: AmlInputConfig): void {
    this.amlForm.patchValue(config);
    this.options.clear();
    if (config.options) {
      config.options.forEach(opt => this.addOption(opt.value, opt.score, opt.id));
    }
  }

  get options(): FormArray {
    return this.amlForm.get('options') as FormArray;
  }

   addOption(value: string = '', score: number = 0, id: string | null = null): void {
    const optionGroup = this.fb.group({
      id: [id],
      value: [value, Validators.required],
      score: [score, [Validators.min(0), Validators.max(10)]]
    });
    this.options.push(optionGroup);
  }

  removeOption(index: number): void {
    this.options.removeAt(index);
  }

  // Méthode pour gérer l'importation de fichier
  onFileUploaded(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const content = e.target.result;
      this.parseCSV(content);
    };
    reader.readAsText(file);

    // Réinitialiser l'input pour permettre de ré-uploader le même fichier si besoin
    event.target.value = '';
  }

  private parseCSV(data: string): void {
    const lines = data.split('\n');
    this.options.clear();

    lines.forEach(line => {
      const columns = line.split(',');
      if (columns.length >= 2) {
        const value = columns[0].trim();
        let score = parseFloat(columns[1].trim());

        if (value && !isNaN(score)) {
          // Force le score entre 0 et 10 même si le CSV contient d'autres valeurs
          score = Math.max(0, Math.min(10, score));
          this.addOption(value, score);
        }
      }
    });
  }

  // onSubmit(): void {
  //   if (this.amlForm.valid) {
  //     const result: InputTypeConfig = this.amlForm.value;
  //     console.log('Données à sauvegarder :', result);
  //     // Appel au service de sauvegarde ici
  //   }
  // }



  getFormValidationErrors() {
    const errors: any = {};
    Object.keys(this.amlForm.controls).forEach(key => {
      const controlErrors = this.amlForm.get(key)?.errors;
      if (controlErrors != null) {
        errors[key] = controlErrors;
      }
      // If you have FormGroups or FormArrays, you'd need to recurse here
    });
    console.table(errors); // This shows a nice table in the browser console
    return errors;
  }
}
