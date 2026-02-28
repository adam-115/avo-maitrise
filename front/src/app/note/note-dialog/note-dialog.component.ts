import { Component, EventEmitter, inject, Input, OnInit, OnChanges, SimpleChanges, Output, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Note, NoteCategory } from '../../appTypes';
import { NoteCategoryService } from '../../services/note-category.service';

@Component({
  selector: 'app-note-dialog',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './note-dialog.component.html',
  styleUrl: './note-dialog.component.css'
})
export class NoteDialogComponent implements OnInit, OnChanges {
  noteCategoryService = inject(NoteCategoryService);
  noteCategories: NoteCategory[] = [];
  @Output()
  noteCreated = new EventEmitter<Note>();
  @Output()
  closeModalEvent = new EventEmitter<void>();
  @Input({ required: true })
  dossierId: string = '';
  @Input({ required: true })
  auteurId: string = '';
  @Input()
  noteToEdit: Note | null = null;
  @Output()
  noteUpdated = new EventEmitter<Note>();
  noteForm: FormGroup;

  constructor() {
    this.noteForm = new FormGroup({
      titre: new FormControl('', [Validators.required, Validators.minLength(3)]),
      description: new FormControl('', [Validators.required, Validators.minLength(3)]),
      categoryId: new FormControl('', []),

    });
  }

  ngOnInit(): void {
    this.noteCategoryService.getAll().subscribe((noteCategories) => {
      this.noteCategories = noteCategories;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['noteToEdit'] && this.noteToEdit) {
      this.noteForm.patchValue({
        titre: this.noteToEdit.title,
        description: this.noteToEdit.description,
        categoryId: this.noteToEdit.categoryId
      });
    } else if (changes['noteToEdit'] && !this.noteToEdit) {
      this.noteForm.reset({
        categoryId: ''
      });
    }
  }

  private mapFormToNote(): Note {
    return {
      id: this.noteToEdit?.id,
      title: this.noteForm.get('titre')?.value,
      description: this.noteForm.get('description')?.value,
      categoryId: this.noteForm.get('categoryId')?.value,
      dossierId: this.dossierId,
      auteurId: this.auteurId,
      createdAt: this.noteToEdit ? this.noteToEdit.createdAt : new Date(),
      updatedAt: new Date(),
    };
  }

  closeNoteDialog(): void {
    this.closeModalEvent.emit();
  }

  submitForm() {
    if (this.noteForm.valid) {
      const note = this.mapFormToNote();
      if (this.noteToEdit) {
        this.noteUpdated.emit(note);
      } else {
        this.noteCreated.emit(note);
      }
      this.closeModalEvent.emit();
    }
  }


}
