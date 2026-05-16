import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NoteDialogComponent } from '../note-dialog/note-dialog.component';
import { Note, NoteCategory } from '../../appTypes';
import { NoteService } from '../../services/note.service';
import { NoteCategoryService } from '../../services/note-category.service';
import { AlertService } from '../../services/alert-service';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';

@Component({
  selector: 'app-note',
  imports: [NoteDialogComponent, CommonModule, FormsModule],
  templateUrl: './note.component.html',
  styleUrl: './note.component.css'
})
export class NoteComponent implements OnInit {

  private alertService = inject(AlertService);

  notes: Note[] = [];
  categories: NoteCategory[] = [];
  searchTerm: string = '';
  showNoteDialog = false;
  selectedNote: Note | null = null;
  @Input() dossierID = "1";
  @Input() userId = "2";

  private noteService = inject(NoteService);
  private noteCategoryService = inject(NoteCategoryService);

  ngOnInit() {
    this.loadNotes();
    this.loadCategories();
  }

  get filteredNotes() {
    if (!this.searchTerm.trim()) {
      return this.notes;
    }
    const lowerTerm = this.searchTerm.toLowerCase();
    return this.notes.filter(note => 
      note.title.toLowerCase().includes(lowerTerm) || 
      note.description.toLowerCase().includes(lowerTerm)
    );
  }

  loadNotes() {
    this.noteService.getAll().subscribe((data: PaginatedResponse<Note>) => {
      this.notes = data.content.filter(n => String(n.dossierId) === String(this.dossierID));
    });
  }

  loadCategories() {
    this.noteCategoryService.getAll().subscribe((categories: PaginatedResponse<NoteCategory>) => {
      this.categories =   categories.content;
    });
  }

  getCategoryColor(categoryId: string | number): string {
    const category = this.categories.find(c => String(c.id) === String(categoryId));
    return category?.color || '#06b6d4'; // default to cyan
  }

  getCategoryName(categoryId: string | number): string {
    const category = this.categories.find(c => String(c.id) === String(categoryId));
    return category?.label || 'Sans catégorie';
  }

  openNoteCreationModal() {
    this.selectedNote = null;
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


  async deleteNote(id?: number | string) {
    if (!id) return;

    const confirm = await this.alertService.confirmMessage(
      'Supprimer cette note ?',
      'Êtes-vous sûr de vouloir enlever cette note du dossier ? Cette action est irréversible.',
      'warning'
    );

    if (confirm) {
      this.noteService.delete(id).subscribe(() => {
        this.notes = this.notes.filter(c => c.id !== id);
        this.alertService.success('La note a été retiré du dossier.');
      });
    }
  }



  editNote(note: Note) {
    this.selectedNote = note;
    this.showNoteDialog = true;
  }

  updateNote(updatedNote: Note) {
    if (!updatedNote.id) return;
    this.noteService.update(updatedNote).subscribe(note => {
      const index = this.notes.findIndex(n => n.id === note.id);
      if (index !== -1) {
        this.notes[index] = note;
      }
      this.alertService.success('La note a été mise à jour.');
    });
  }







}
