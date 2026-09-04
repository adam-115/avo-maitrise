import { Component, inject, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NoteDialogComponent } from '../note-dialog/note-dialog.component';
import { Note, NoteCategory, User } from '../../appTypes';
import { NoteService } from '../../services/note.service';
import { NoteCategoryService } from '../../services/note-category.service';
import { UserService } from '../../services/user.service';
import { AlertService } from '../../services/alert-service';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';

@Component({
  selector: 'app-note',
  standalone: true,
  imports: [NoteDialogComponent, CommonModule, FormsModule, TranslatePipe],
  templateUrl: './note.component.html',
  styleUrl: './note.component.css'
})
export class NoteComponent implements OnInit, OnChanges {
  private alertService = inject(AlertService);
  private noteService = inject(NoteService);
  private noteCategoryService = inject(NoteCategoryService);
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);

  @Input() dossierId!: string | number;
  @Input() dossierID!: string | number;
  @Input() selectedDossier: any = null;
  @Input() dossier: any = null;
  @Input() userId: string = '2';
  @Input() users: User[] = [];

  notes: Note[] = [];
  categories: NoteCategory[] = [];
  searchTerm: string = '';
  selectedCategoryId: string = '';
  showNoteDialog = false;
  selectedNote: Note | null = null;
  isLoading = false;

  // Pagination
  currentPage = 1;
  pageSize = 6;

  ngOnInit(): void {
    this.loadUsers();
    this.loadCategories();
    this.loadNotes();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dossierId'] || changes['dossierID'] || changes['selectedDossier'] || changes['dossier']) {
      this.currentPage = 1;
      this.loadNotes();
    }
  }

  get activeDossierId(): string | number {
    if (this.dossierId) return this.dossierId;
    if (this.dossierID) return this.dossierID;
    if (this.selectedDossier?.id) return this.selectedDossier.id;
    if (this.dossier?.id) return this.dossier.id;
    
    // Check route parameters hierarchically
    let r: ActivatedRoute | null = this.route;
    while (r) {
      if (r.snapshot.params && r.snapshot.params['id']) {
        return r.snapshot.params['id'];
      }
      r = r.parent;
    }
    return '';
  }

  loadUsers(): void {
    if (this.users && this.users.length > 0) return;
    this.userService.getAll().subscribe({
      next: (data: PaginatedResponse<User>) => {
        this.users = data.content || (Array.isArray(data) ? data : []);
      },
      error: () => {}
    });
  }

  loadCategories(): void {
    this.noteCategoryService.getAll().subscribe({
      next: (res: PaginatedResponse<NoteCategory>) => {
        this.categories = res.content || (Array.isArray(res) ? res : []);
      },
      error: () => {}
    });
  }

  loadNotes(): void {
    const id = this.activeDossierId;
    if (!id) return;

    this.isLoading = true;
    this.noteService.getByDossierId(id, 0, 1000).subscribe({
      next: (data: PaginatedResponse<Note>) => {
        this.notes = data.content || (Array.isArray(data) ? data : []);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading notes:', err);
        this.isLoading = false;
      }
    });
  }

  get filteredNotes(): Note[] {
    return (this.notes || []).filter(note => {
      const matchesSearch = this.searchTerm
        ? ((note.title || '').toLowerCase().includes(this.searchTerm.toLowerCase()) || 
           (note.description || '').toLowerCase().includes(this.searchTerm.toLowerCase()))
        : true;
      const matchesCategory = this.selectedCategoryId
        ? String(note.categoryId) === String(this.selectedCategoryId)
        : true;
      return matchesSearch && matchesCategory;
    });
  }

  get paginatedNotes(): Note[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredNotes.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredNotes.length / this.pageSize));
  }

  get currentEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredNotes.length);
  }

  onFilterChange(): void {
    this.currentPage = 1;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getCategory(categoryId: string | number): NoteCategory | undefined {
    return this.categories.find(c => String(c.id) === String(categoryId));
  }

  getCategoryColor(categoryId: string | number): string {
    const cat = this.getCategory(categoryId);
    return cat?.color || '#6366f1';
  }

  getCategoryName(categoryId: string | number): string {
    const cat = this.getCategory(categoryId);
    return cat?.label || 'Sans catégorie';
  }

  getAuthorName(auteurId: string | number): string {
    if (!auteurId) return 'Avocat';
    const user = this.users.find(u => String(u.id) === String(auteurId));
    if (user) {
      const first = user.firstName || '';
      const last = user.lastName || user.username || '';
      return `${first} ${last}`.trim() || user.username || 'Avocat';
    }
    return 'Avocat';
  }

  getAuthorInitials(auteurId: string | number): string {
    if (!auteurId) return 'AV';
    const user = this.users.find(u => String(u.id) === String(auteurId));
    if (user) {
      const first = user.firstName ? user.firstName.charAt(0) : '';
      const last = user.lastName ? user.lastName.charAt(0) : '';
      return (first + last).toUpperCase() || (user.username ? user.username.substring(0, 2).toUpperCase() : 'AV');
    }
    return 'AV';
  }

  openNoteCreationModal(): void {
    this.selectedNote = null;
    this.showNoteDialog = true;
  }

  editNote(note: Note): void {
    this.selectedNote = note;
    this.showNoteDialog = true;
  }

  closeNoteCreationModal(): void {
    this.showNoteDialog = false;
    this.selectedNote = null;
  }

  handleSaveNote(note: Note): void {
    const rawDossierId = this.activeDossierId || note.dossierId;
    if (!rawDossierId) {
      this.alertService.displayMessage('Erreur', 'Identifiant du dossier introuvable. Veuillez recharger la page.', 'error');
      return;
    }

    const payload: Note = {
      ...note,
      dossierId: Number(rawDossierId),
      auteurId: this.userId ? Number(this.userId) : (note.auteurId ? Number(note.auteurId) : 1),
      categoryId: note.categoryId ? Number(note.categoryId) : (this.categories.length > 0 ? Number(this.categories[0].id) : 1)
    };

    if (payload.id) {
      this.noteService.update(payload).subscribe({
        next: () => {
          this.loadNotes();
          this.closeNoteCreationModal();
          this.alertService.success('Note mise à jour avec succès');
        },
        error: (err) => {
          console.error('Failed to update note:', err);
          this.alertService.displayMessage('Erreur', 'Impossible de mettre à jour la note', 'error');
        }
      });
    } else {
      this.noteService.create(payload).subscribe({
        next: () => {
          this.loadNotes();
          this.closeNoteCreationModal();
          this.alertService.success('Note créée avec succès');
        },
        error: (err) => {
          console.error('Failed to create note:', err);
          this.alertService.displayMessage('Erreur', 'Impossible de créer la note', 'error');
        }
      });
    }
  }

  async deleteNote(id?: number | string): Promise<void> {
    if (!id) return;

    const confirm = await this.alertService.confirmMessage(
      'Supprimer cette note ?',
      'Voulez-vous vraiment supprimer définitivement cette note du dossier ?',
      'warning'
    );

    if (confirm) {
      this.noteService.delete(id).subscribe({
        next: () => {
          this.loadNotes();
          this.alertService.success('La note a été supprimée avec succès.');
        },
        error: (err) => {
          console.error('Failed to delete note:', err);
          this.alertService.displayMessage('Erreur', 'Impossible de supprimer la note', 'error');
        }
      });
    }
  }

  trackByNoteId(index: number, note: Note): any {
    return note.id || index;
  }
}
