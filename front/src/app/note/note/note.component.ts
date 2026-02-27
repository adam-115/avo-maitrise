import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoteDialogComponent } from '../note-dialog/note-dialog.component';
import { Note, NoteCategory } from '../../appTypes';
import { NoteService } from '../../services/note.service';
import { NoteCategoryService } from '../../services/note-category.service';

@Component({
  selector: 'app-note',
  imports: [NoteDialogComponent, CommonModule],
  templateUrl: './note.component.html',
  styleUrl: './note.component.css'
})
export class NoteComponent implements OnInit {

  notes: Note[] = [];
  categories: NoteCategory[] = [];
  showNoteDialog = false;
  @Input() dossierID = "1";
  @Input() userId = "2";

  private noteService = inject(NoteService);
  private noteCategoryService = inject(NoteCategoryService);

  ngOnInit() {
    this.loadNotes();
    this.loadCategories();
  }

  loadNotes() {
    this.noteService.getAll().subscribe(notes => {
      this.notes = notes.filter(n => String(n.dossierId) === String(this.dossierID));
    });
  }

  loadCategories() {
    this.noteCategoryService.getAll().subscribe(categories => {
      this.categories = categories;
    });
  }

  getCategoryColor(categoryId: string | number): string {
    const category = this.categories.find(c => String(c.id) === String(categoryId));
    return category?.color || '#06b6d4'; // default to cyan
  }

  openNoteCreationModal() {
    this.showNoteDialog = true;
  }

  closeNoteCreationModal() {
    this.showNoteDialog = false;
  }

  addNote(note: Note) {
    this.noteService.create(note).subscribe(newNote => {
      this.notes.push(newNote);
    });
  }








}
