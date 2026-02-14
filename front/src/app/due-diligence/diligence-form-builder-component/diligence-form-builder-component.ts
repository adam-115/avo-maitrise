import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NewDiligenceField } from "../new-diligence-field/new-diligence-field";
import { UtilsService } from '../../services/utils-service';
import { FieldConfig } from '../../appTypes';



@Component({
  selector: 'app-diligence-form-builder-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NewDiligenceField],
  templateUrl: './diligence-form-builder-component.html',
  styleUrl: './diligence-form-builder-component.css',
})
export class DiligenceFormBuilderComponent implements OnInit {

  diligenceForm!: FormGroup;
  fb = inject(FormBuilder);
  utilsService = inject(UtilsService);

  showDialog = false;
  formFields: FieldConfig[] = [];


  ngOnInit(): void {
    this.diligenceForm = this.fb.group({});

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

  onSubmit() {
    alert('Form submitted! Check console for values.');
    console.log(this.diligenceForm.value);
  }


}
