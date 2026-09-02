import { Component, inject, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { NoteDialogComponent } from '../note-dialog/note-dialog.component';
import { Note, NoteCategory } from '../../appTypes';
import { NoteService } from '../../services/note.service';
import { NoteCategoryService } from '../../services/note-category.service';
import { AlertService } from '../../services/alert-service';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';

@Component({
  selector: 'app-note',
  imports: [NoteDialogComponent, CommonModule, FormsModule, TranslatePipe],
  templateUrl: './note.component.html',
  styleUrl: './note.component.css'
})
export class NoteComponent implements OnInit, OnChanges {

  private alertService = inject(AlertService);
  private noteService = inject(NoteService);
  private noteCategoryService = inject(NoteCategoryService);

  notes: Note[] = [];
  categories: NoteCategory[] = [];
  searchTerm: string = '';
  showNoteDialog = false;
  selectedNote: Note | null = null;

  @Input() dossierID = "1";
  @Input() userId = "2";

  // Pagination
  currentPage = 1;
  pageSize = 6;

  ngOnInit() {
    this.loadNotes();
    this.loadCategories();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dossierID'] && !changes['dossierID'].firstChange) {
      this.currentPage = 1;
      this.loadNotes();
    }
  }

  get filteredNotes(): Note[] {
    if (!this.searchTerm.trim()) {
      return this.notes;
    }
    const lowerTerm = this.searchTerm.toLowerCase();
    return this.notes.filter(note => 
      (note.title && note.title.toLowerCase().includes(lowerTerm)) || 
      (note.description && note.description.toLowerCase().includes(lowerTerm))
    );
  }

  get paginatedNotes(): Note[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredNotes.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredNotes.length / this.pageSize);
  }

  get currentEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredNotes.length);
  }

  onSearchChange() {
    this.currentPage = 1;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  loadNotes() {
    if (!this.dossierID) return;
    this.noteService.getByDossierId(this.dossierID, 0, 1000).subscribe((data: PaginatedResponse<Note>) => {
      this.notes = data.content;
    });
  }

  loadCategories() {
    this.noteCategoryService.getAll().subscribe((categories: PaginatedResponse<NoteCategory>) => {
      this.categories = categories.content;
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
    this.noteService.create(note).subscribe(() => {
      this.loadNotes();
      this.closeNoteCreationModal();
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
        this.loadNotes();
        this.alertService.success('La note a été retirée du dossier.');
      });
    }
  }

  editNote(note: Note) {
    this.selectedNote = note;
    this.showNoteDialog = true;
  }

  updateNote(updatedNote: Note) {
    if (!updatedNote.id) return;
    this.noteService.update(updatedNote).subscribe(() => {
      this.loadNotes();
      this.closeNoteCreationModal();
      this.alertService.success('La note a été mise à jour.');
    });
  }
}
