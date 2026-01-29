import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Document } from './../../appTypes';

@Component({
  selector: 'app-document-dialog',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './document-dialog.html',
  styleUrl: './document-dialog.css'
})
export class DocumentDialog implements OnInit, OnChanges {


  @Output()
  addDocumentEvent = new EventEmitter<Document>;
  @Output()
  closeDialogEvent = new EventEmitter<void>
  @Input()
  dialogTitle = "Ajouter un Document";
  @Input()
  selectedDocument: Document | null = null;
  fb = inject(FormBuilder);
  documentDialogFrom!: FormGroup;
  selectedFile: File | null = null;




  ngOnInit(): void {
    this.documentDialogFrom = this.fb.group({
      title: ["", Validators.required],
      description: [""],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedDocument']) {
      if (this.selectedDocument) {
        this.documentToForm(this.selectedDocument);
      }
    }
  }

  closeModal() {
    this.closeDialogEvent.emit();
  }

  private reset() {
    this.documentDialogFrom.reset();
    this.selectedFile = null;
  }

  private formToDocument(): Document {
    const formValues = this.documentDialogFrom.getRawValue();

    return {
      // Si vous êtes en mode édition, gardez l'ID existant
      ...(this.selectedDocument && { id: this.selectedDocument.id }),

      title: formValues.title,
      description: formValues.description,

      // Le nom du fichier provient de l'objet File
      name: this.selectedFile ? this.selectedFile.name : '',

      // Le fichier physique
      file: this.selectedFile as File,

      // Optionnel : tags peut être ajouté ici ou via un autre champ
      tags: ''
    };
  }

  private documentToForm(doc: Document): void {
    this.documentDialogFrom.patchValue({
      title: doc.title,
      description: doc.description
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  submit() {
    if (this.documentDialogFrom.valid && this.selectedFile) {
      let newDocument: Document = this.formToDocument();
      if (this.selectedFile) {
        newDocument.file = this.selectedFile;
      }
      this.addDocumentEvent.emit(this.formToDocument());
    }
  }

}
