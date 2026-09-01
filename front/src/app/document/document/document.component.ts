import { Component, inject, Input, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentDialog } from '../document-dialog/document-dialog';
import { Dossier, Document } from '../../appTypes';
import { DocumentService } from '../../services/document.service';
import { ClientService } from '../../services/client-service';
import { DossierService } from '../../services/dossier.service';
import { AlertService } from '../../services/alert-service';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';

@Component({
  selector: 'app-document',
  imports: [DocumentDialog, CommonModule, TranslatePipe, TranslateDirective],
  templateUrl: './document.component.html',
  styleUrl: './document.component.css'
})
export class DocumentComponent implements OnInit, OnChanges {

  @Input()
  selectedDossier: Dossier | null = null;
  showAddDocumentDialog = false;

  documents: Document[] = [];
  documentService = inject(DocumentService);
  dossierService = inject(DossierService);
  alertService = inject(AlertService);
  Math = Math;

  // Pagination
  currentPage = 1; // 1-indexed for UI
  pageSize = 5;
  totalElements = 0;
  totalPages = 0;

  ngOnInit(): void {
    this.refreshDocuments();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedDossier'] && !changes['selectedDossier'].firstChange) {
      this.currentPage = 1; // Reset to first page on dossier change
      this.refreshDocuments();
    }
  }

  refreshDocuments() {
    if (this.selectedDossier?.id) {
      this.documentService.getByDossierId(
        this.selectedDossier.id, 
        this.currentPage - 1, 
        this.pageSize
      ).subscribe({
        next: (response) => {
          this.documents = response.content;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
        },
        error: (err) => {
          console.error('Error fetching documents:', err);
        }
      });
    } else {
      this.documents = [];
    }
  }

  openDocumentDialog() {
    this.showAddDocumentDialog = true;
  }

  closeDocumentDialog() {
    this.showAddDocumentDialog = false;
  }

  addDocument(document: Document) {
    if (this.selectedDossier) {
      document.date = new Date();
      document.clientId = this.selectedDossier.clientId;
      document.dossierId = Number(this.selectedDossier.id);

      this.documentService.create(document).subscribe({
        next: (savedDoc) => {
          if (this.selectedDossier) {
            this.refreshDocuments();
          }
          this.alertService.success('Document ajouté avec succès');
          this.closeDocumentDialog();
        },
        error: (err) => {
          console.error('Error creating document:', err);
          this.alertService.displayMessage('Erreur', 'Erreur lors de l\'ajout du document','error');
        }
      });
    }
  }

  async deleteDocument(doc: Document, index: number) {
    const confirmed = await this.alertService.confirmMessage(
      'Suppression',
      'Voulez-vous vraiment supprimer ce document ?',
      'warning'
    );

    if (confirmed && doc.id) {
      this.documentService.delete(doc.id).subscribe({
        next: () => {
          this.refreshDocuments();
          this.alertService.success('Document supprimé');
        },
        error: (err) => {
          console.error('Error deleting document:', err);
          this.alertService.displayMessage('Erreur', 'Erreur lors de la suppression du document','error');
        }
      });
    }
  }

  downloadDocument(doc: Document) {
    if (!doc.fileData) {
      this.alertService.displayMessage('Erreur', 'Aucune donnée de fichier disponible', 'error');
      return;
    }

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
    a.download = doc.filename || doc.nomFichier || 'document';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Pagination helpers

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.refreshDocuments();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.refreshDocuments();
    }
  }

}
