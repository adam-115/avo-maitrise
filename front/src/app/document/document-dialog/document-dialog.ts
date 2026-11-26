import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Document } from './../../appTypes';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-document-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './document-dialog.html',
  styleUrl: './document-dialog.css'
})
export class DocumentDialog implements OnInit, OnChanges {

  @Output() addDocumentEvent = new EventEmitter<Document>();
  @Output() closeDialogEvent = new EventEmitter<void>();
  @Input() dialogTitle = '';
  @Input() selectedDocument: Document | null = null;

  fb = inject(FormBuilder);
  documentDialogFrom = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    tags: ['']
  });

  selectedFile: File | null = null;
  isDragging = false;
  isSubmitting = false;

  ngOnInit(): void {
    if (this.selectedDocument) {
      this.documentToForm(this.selectedDocument);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedDocument'] && this.selectedDocument) {
      this.documentToForm(this.selectedDocument);
    }
  }

  closeModal(): void {
    this.closeDialogEvent.emit();
  }

  private formToDocument(): Document {
    const formValues = this.documentDialogFrom.getRawValue();

    return {
      ...(this.selectedDocument && { id: this.selectedDocument.id }),
      title: formValues.title || '',
      description: formValues.description || '',
      name: this.selectedFile ? this.selectedFile.name : (this.selectedDocument?.name || ''),
      file: this.selectedFile as File,
      tags: formValues.tags || this.selectedDocument?.tags || ''
    };
  }

  private documentToForm(doc: Document): void {
    this.documentDialogFrom.patchValue({
      title: doc.title || doc.name || doc.nomFichier || '',
      description: doc.description || '',
      tags: doc.tags || ''
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files?.[0];
    if (file) {
      this.setFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.setFile(file);
    }
  }

  private setFile(file: File): void {
    this.selectedFile = file;
    // Auto populate title if empty
    const currentTitle = this.documentDialogFrom.get('title')?.value;
    if (!currentTitle || currentTitle.trim() === '') {
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      this.documentDialogFrom.patchValue({ title: cleanName });
    }
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
  }

  formatFileSize(bytes?: number): string {
    if (!bytes || bytes === 0) return '0 Ko';
    const k = 1024;
    const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getFileExtension(filename?: string): string {
    if (!filename) return 'DOC';
    const ext = filename.split('.').pop()?.toUpperCase();
    return ext || 'DOC';
  }

  getFileIconColor(filename?: string): string {
    const ext = filename?.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'bg-red-100 text-red-600 border-red-200';
      case 'doc':
      case 'docx':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'xls':
      case 'xlsx':
      case 'csv':
        return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'webp':
      case 'svg':
        return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'zip':
      case 'rar':
      case '7z':
        return 'bg-amber-100 text-amber-600 border-amber-200';
      default:
        return 'bg-indigo-100 text-indigo-600 border-indigo-200';
    }
  }

  submit(): void {
    if (this.documentDialogFrom.invalid) {
      this.documentDialogFrom.markAllAsTouched();
      return;
    }

    if (!this.selectedFile && !this.selectedDocument) {
      return;
    }

    this.isSubmitting = true;

    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        const newDocument: Document = this.formToDocument();
        newDocument.fileData = base64String;
        newDocument.filename = this.selectedFile?.name;
        newDocument.nomFichier = this.selectedFile?.name;
        this.addDocumentEvent.emit(newDocument);
        this.isSubmitting = false;
      };
      reader.onerror = () => {
        this.isSubmitting = false;
      };
      reader.readAsDataURL(this.selectedFile);
    } else if (this.selectedDocument) {
      const newDocument: Document = this.formToDocument();
      newDocument.filename = this.selectedDocument.filename;
      newDocument.nomFichier = this.selectedDocument.nomFichier;
      newDocument.fileData = this.selectedDocument.fileData;
      this.addDocumentEvent.emit(newDocument);
      this.isSubmitting = false;
    }
  }
}
