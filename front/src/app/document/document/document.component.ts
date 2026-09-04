import { Component, inject, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentDialog } from '../document-dialog/document-dialog';
import { Dossier, Document } from '../../appTypes';
import { DocumentService } from '../../services/document.service';
import { AlertService } from '../../services/alert-service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-document',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentDialog, TranslatePipe],
  templateUrl: './document.component.html',
  styleUrl: './document.component.css'
})
export class DocumentComponent implements OnInit, OnChanges {

  @Input() selectedDossier: Dossier | null = null;
  @Input() dossierId: string | number = '';
  @Input() dossier: Dossier | null = null;

  showAddDocumentDialog = false;
  selectedDocForEdit: Document | null = null;

  documents: Document[] = [];
  documentService = inject(DocumentService);
  alertService = inject(AlertService);

  // Search & Filter & View
  searchTerm = '';
  selectedFilterType = 'ALL';
  viewMode: 'table' | 'grid' = 'table';
  isLoading = false;

  // Pagination
  currentPage = 1; // 1-indexed for UI
  pageSize = 8;
  totalElements = 0;
  totalPages = 0;

  ngOnInit(): void {
    this.refreshDocuments();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['selectedDossier'] || changes['dossier'] || changes['dossierId']) && !changes['selectedDossier']?.firstChange) {
      this.currentPage = 1;
      this.refreshDocuments();
    }
  }

  get targetDossierId(): string | number | undefined {
    return this.selectedDossier?.id || this.dossier?.id || this.dossierId;
  }

  refreshDocuments(): void {
    const id = this.targetDossierId;
    if (id) {
      this.isLoading = true;
      this.documentService.getByDossierId(
        id, 
        this.currentPage - 1, 
        this.pageSize
      ).subscribe({
        next: (response) => {
          this.documents = response.content || response || [];
          this.totalElements = response.totalElements !== undefined ? response.totalElements : this.documents.length;
          this.totalPages = response.totalPages !== undefined ? response.totalPages : Math.ceil(this.totalElements / this.pageSize);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching documents:', err);
          this.isLoading = false;
        }
      });
    } else {
      this.documents = [];
      this.isLoading = false;
    }
  }

  get filteredDocuments(): Document[] {
    let list = this.documents || [];

    // Filter by search term
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      list = list.filter(doc => {
        const title = (doc.title || doc.name || doc.nomFichier || '').toLowerCase();
        const desc = (doc.description || '').toLowerCase();
        const tags = (doc.tags || '').toLowerCase();
        const filename = (doc.filename || doc.nomFichier || '').toLowerCase();
        return title.includes(term) || desc.includes(term) || tags.includes(term) || filename.includes(term);
      });
    }

    // Filter by document type / extension category
    if (this.selectedFilterType !== 'ALL') {
      list = list.filter(doc => {
        const cat = this.getFileCategory(doc.filename || doc.nomFichier || doc.name || '');
        return cat.toUpperCase() === this.selectedFilterType;
      });
    }

    return list;
  }

  openDocumentDialog(docToEdit?: Document): void {
    this.selectedDocForEdit = docToEdit || null;
    this.showAddDocumentDialog = true;
  }

  closeDocumentDialog(): void {
    this.showAddDocumentDialog = false;
    this.selectedDocForEdit = null;
  }

  addDocument(document: Document): void {
    const activeDossier = this.selectedDossier || this.dossier;
    if (activeDossier && activeDossier.id) {
      document.date = new Date();
      document.clientId = activeDossier.clientId;
      document.dossierId = Number(activeDossier.id);

      this.documentService.create(document).subscribe({
        next: () => {
          this.refreshDocuments();
          this.alertService.success('Document ajouté avec succès');
          this.closeDocumentDialog();
        },
        error: (err) => {
          console.error('Error creating document:', err);
          this.alertService.displayMessage('Erreur', 'Erreur lors de l\'ajout du document', 'error');
        }
      });
    }
  }

  async deleteDocument(doc: Document, index?: number): Promise<void> {
    const confirmed = await this.alertService.confirmMessage(
      'Suppression',
      'Voulez-vous vraiment supprimer ce document ?',
      'warning'
    );

    if (confirmed && doc.id) {
      this.documentService.delete(doc.id).subscribe({
        next: () => {
          this.refreshDocuments();
          this.alertService.success('Document supprimé avec succès');
        },
        error: (err) => {
          console.error('Error deleting document:', err);
          this.alertService.displayMessage('Erreur', 'Erreur lors de la suppression du document', 'error');
        }
      });
    }
  }

  downloadDocument(doc: Document): void {
    if (!doc.fileData) {
      this.alertService.displayMessage('Erreur', 'Aucune donnée de fichier disponible', 'error');
      return;
    }

    try {
      const byteCharacters = atob(doc.fileData as any);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.filename || doc.nomFichier || doc.name || 'document';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download error:', e);
      this.alertService.displayMessage('Erreur', 'Impossible de télécharger le fichier', 'error');
    }
  }

  getFileExtension(filename?: string): string {
    if (!filename) return 'DOC';
    const parts = filename.split('.');
    if (parts.length > 1) {
      return parts.pop()?.toUpperCase() || 'DOC';
    }
    return 'DOC';
  }

  getFileCategory(filename?: string): string {
    const ext = this.getFileExtension(filename).toLowerCase();
    if (['pdf'].includes(ext)) return 'PDF';
    if (['doc', 'docx', 'odt', 'rtf', 'txt'].includes(ext)) return 'WORD';
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return 'EXCEL';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return 'IMAGE';
    return 'OTHER';
  }

  getFileBadgeClass(filename?: string): string {
    const cat = this.getFileCategory(filename);
    switch (cat) {
      case 'PDF':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'WORD':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'EXCEL':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'IMAGE':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  }

  getFileIconColor(filename?: string): string {
    const cat = this.getFileCategory(filename);
    switch (cat) {
      case 'PDF':
        return 'text-rose-600 bg-rose-100/70 border-rose-200';
      case 'WORD':
        return 'text-blue-600 bg-blue-100/70 border-blue-200';
      case 'EXCEL':
        return 'text-emerald-600 bg-emerald-100/70 border-emerald-200';
      case 'IMAGE':
        return 'text-purple-600 bg-purple-100/70 border-purple-200';
      default:
        return 'text-indigo-600 bg-indigo-100/70 border-indigo-200';
    }
  }

  // Pagination helpers
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.refreshDocuments();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.refreshDocuments();
    }
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.refreshDocuments();
    }
  }

  getPageArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
