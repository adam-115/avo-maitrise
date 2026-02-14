import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UtilsService } from '../../services/utils-service';
import { FieldConfig, FieldOption } from '../../appTypes';


@Component({
  selector: 'app-new-diligence-field',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './new-diligence-field.html',
  styleUrl: './new-diligence-field.css'
})
export class NewDiligenceField {
  @Output() fieldAdded = new EventEmitter<FieldConfig>();
  @Output() close = new EventEmitter<void>();

  utilsService = inject(UtilsService);
  fieldForm: FormGroup;
  options: FieldOption[] = [];

  constructor(private fb: FormBuilder) {
    this.fieldForm = this.fb.group({
      label: ['', Validators.required],
      type: ['text', Validators.required],
      required: [false],
      errorMessage: ['Ce champ est obligatoire'],
      option: [''],
    });
  }

  addOption() {
    this.options.push({
      id: this.utilsService.generateTimestampId(),
      value: this.fieldForm.get('option')?.value,
    });

    this.fieldForm.get('option')?.reset();

  }

  onSubmit() {
    if (this.fieldForm.valid) {
      const newField: FieldConfig = {
        name: this.fieldForm.get('label')?.value,
        type: this.fieldForm.get('type')?.value,
        label: this.fieldForm.get('label')?.value,
        required: this.fieldForm.get('required')?.value,
        errorMessage: this.fieldForm.get('errorMessage')?.value,
        options: this.fieldForm.get('type')?.value === 'select' || this.fieldForm.get('type')?.value === 'radio'
          || this.fieldForm.get('type')?.value === 'checkbox'
          ? this.options : undefined,
      };
      this.fieldAdded.emit(newField);
      this.fieldForm.reset({ type: 'text', required: false });
      console.log(newField);
    }
  }


  onCsvUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const content = e.target.result;
        // Sépare par virgule, point-virgule ou retour à la ligne
        const newOptions = content
          .split(/[,\n;]+/)
          .map((opt: string) => opt.trim())
          .filter((opt: string) => opt.length > 0);

        // On ajoute les nouvelles options à la liste existante
        newOptions.forEach((opt: string) => {
          this.options.push({ value: opt });
        });
      };
      reader.readAsText(file);
      // Reset l'input file pour permettre de ré-uploader le même fichier si besoin
      event.target.value = '';
    }
  }
}
