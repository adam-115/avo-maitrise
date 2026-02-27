import { Component, EventEmitter, inject, Input, OnInit, Output, output } from '@angular/core';
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
export class NoteDialogComponent implements OnInit {
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

  private mapFormToNote(): Note {
    return {
      title: this.noteForm.get('titre')?.value,
      description: this.noteForm.get('description')?.value,
      categoryId: this.noteForm.get('categoryId')?.value,
      dossierId: this.dossierId,
      auteurId: this.auteurId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  closeNoteDialog(): void {
    this.closeModalEvent.emit();
  }

  submitForm() {
    if (this.noteForm.valid) {
      const note = this.mapFormToNote();
      this.noteCreated.emit(note);
      this.closeModalEvent.emit();
    }
  }


}
