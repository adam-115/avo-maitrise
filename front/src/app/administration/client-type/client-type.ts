import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TypeClient } from '../../appTypes';
import { TypeClientService } from '../../services/type-client-service';
import { AlertService } from './../../services/alert-service';
import { NavigationService } from './../../services/navigation-service';

@Component({
  selector: 'app-client-type',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './client-type.html',
  styleUrl: './client-type.css',
})
export class ClientType implements OnInit {

  typeClientService: TypeClientService = inject(TypeClientService);
  navigationService = inject(NavigationService);
  alertService: AlertService = inject(AlertService);
  fb = inject(FormBuilder);
  typeClientForm: FormGroup = new FormGroup({});
  clientTypes: TypeClient[] = [];
  selectedClientType: TypeClient | null = null;

  ngOnInit(): void {
    this.typeClientForm = this.fb.group({
      libelle: ["", Validators.required],
      code: ["", Validators.required],
      ordre_affichage: [0],
      actif: [true],
    });
    this.lodAllClientType();
  }

  private lodAllClientType() {
    this.typeClientService.getAll().subscribe(data => {
      this.clientTypes = data;
    });
  }

  editType(typeClient: TypeClient): void {
    console.log("not implemeneted yet");
  }

  selectType(selectedType: TypeClient): void {
    this.selectedClientType =selectedType;
    this.mapTypeClientToForm(selectedType);
  }

  resetForm() {
    this.typeClientForm?.reset();
    this.selectedClientType = null ;
  }

 private mapFormToTypeClient(existingId?: number): TypeClient {
    const formValues = this.typeClientForm.value;
    return {
      // If you are updating an existing record, pass the ID
      ...(existingId && { id: existingId }),
      libelle: formValues.libelle,
      code: formValues.code,
      ordre_affichage: Number(formValues.ordre_affichage), // Ensures it stays a number
      actif: formValues.actif,
      // Defaulting created_at to now, or you can pass a specific date
      created_at: new Date()
    };
  }

  private mapTypeClientToForm(type: TypeClient): void {
  this.typeClientForm.patchValue({
    libelle: type.libelle,
    code: type.code,
    ordre_affichage: type.ordre_affichage,
    actif: type.actif
  });
}



  submit(): void {
    console.log("start call");
    // check if is update or create
    if (this.selectedClientType == null && this.typeClientForm.valid) {
      console.log("start the function");
      // create new one
      let newClientType = this.mapFormToTypeClient();
      this.typeClientService.create(newClientType).subscribe({
        complete: () => {
          this.alertService.success('element est bien ajouté ');
          this.lodAllClientType();
        }
      });

    } else if (this.selectedClientType && this.typeClientForm.valid) {
      const updatedClientType = this.mapFormToTypeClient(this.selectedClientType.id);
      this.typeClientService.update(this.selectedClientType.id, updatedClientType).subscribe({
        complete: () => {
          this.alertService.success('element est bien modifié');
          this.lodAllClientType();
          this.resetForm();
        }
      });
    }
  }
}
