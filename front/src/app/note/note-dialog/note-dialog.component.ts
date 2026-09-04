import { Component, EventEmitter, inject, Input, OnInit, OnChanges, SimpleChanges, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Note, NoteCategory } from '../../appTypes';
import { NoteCategoryService } from '../../services/note-category.service';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';

@Component({
  selector: 'app-note-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, TranslatePipe],
  templateUrl: './note-dialog.component.html',
  styleUrl: './note-dialog.component.css'
})
export class NoteDialogComponent implements OnInit, OnChanges {
  private noteCategoryService = inject(NoteCategoryService);

  @Input() categories: NoteCategory[] = [];
  @Input() dossierId: string | number = '';
  @Input() auteurId: string | number = '';
  @Input() noteToEdit: Note | null = null;
  @Input() isViewOnly: boolean = false;

  @Output() closeDialog = new EventEmitter<void>();
  @Output() saveNote = new EventEmitter<Note>();

  // Backwards compatibility event emitters
  @Output() noteCreated = new EventEmitter<Note>();
  @Output() noteUpdated = new EventEmitter<Note>();
  @Output() closeModalEvent = new EventEmitter<void>();

  noteForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    if (!this.categories || this.categories.length === 0) {
      this.loadCategories();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.noteForm) {
      this.initForm();
    }
    if (changes['noteToEdit']) {
      this.populateForm();
    }
  }

  private initForm(): void {
    this.noteForm = new FormGroup({
      title: new FormControl('', [Validators.required, Validators.minLength(2)]),
      description: new FormControl('', [Validators.required, Validators.minLength(2)]),
      categoryId: new FormControl('', [Validators.required])
    });
    this.populateForm();
  }

  private populateForm(): void {
    if (!this.noteForm) return;

    if (this.noteToEdit) {
      this.noteForm.patchValue({
        title: this.noteToEdit.title,
        description: this.noteToEdit.description || '',
        categoryId: this.noteToEdit.categoryId || ''
      });
    } else {
      const defaultCat = this.categories && this.categories.length > 0 ? this.categories[0].id : '';
      this.noteForm.reset({
        title: '',
        description: '',
        categoryId: defaultCat
      });
    }

    if (this.isViewOnly) {
      this.noteForm.disable();
    } else {
      this.noteForm.enable();
    }
  }

  loadCategories(): void {
    this.noteCategoryService.getAll().subscribe({
      next: (res: PaginatedResponse<NoteCategory>) => {
        this.categories = res.content || (Array.isArray(res) ? res : []);
        if (!this.noteToEdit && this.categories.length > 0 && !this.noteForm.get('categoryId')?.value) {
          this.noteForm.patchValue({ categoryId: this.categories[0].id });
        }
      },
      error: () => {}
    });
  }

  get isEditing(): boolean {
    return !!this.noteToEdit && !!this.noteToEdit.id;
  }

  onClose(): void {
    this.closeDialog.emit();
    this.closeModalEvent.emit();
  }

  onSubmit(): void {
    if (this.noteForm.invalid) {
      this.noteForm.markAllAsTouched();
      return;
    }

    const formVal = this.noteForm.getRawValue();
    const noteData: Note = {
      id: this.noteToEdit?.id,
      title: formVal.title,
      description: formVal.description,
      categoryId: formVal.categoryId,
      dossierId: this.dossierId,
      auteurId: this.auteurId,
      createdAt: this.noteToEdit ? this.noteToEdit.createdAt : new Date(),
      updatedAt: new Date()
    };

    this.saveNote.emit(noteData);
    this.onClose();
  }
}
