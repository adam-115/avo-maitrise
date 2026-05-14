import { Component, inject, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentDialog } from '../document-dialog/document-dialog';
import { Dossier, Document } from '../../appTypes';
import { DocumentService } from '../../services/document.service';
import { ClientService } from '../../services/client-service';
import { DossierService } from '../../services/dossier.service';
import { AlertService } from '../../services/alert-service';

@Component({
  selector: 'app-document',
  imports: [DocumentDialog, CommonModule],
  templateUrl: './document.component.html',
  styleUrl: './document.component.css'
})
export class DocumentComponent implements OnInit {

  @Input()
  selectedDossier: Dossier | null = null;
  showAddDocumentDialog = false;

  documents: Document[] = [];
  documentService = inject(DocumentService);
  dossierService = inject(DossierService);
  alertService = inject(AlertService);
  Math = Math;

  // Pagination
  currentPage = 1;
  pageSize = 5;

  ngOnInit(): void {
    this.refreshDocuments();
  }

  refreshDocuments() {
    this.documents = this.selectedDossier?.documents || [];
  }

  openDocumentDialog() {
    this.showAddDocumentDialog = true;
  }

  closeDocumentDialog() {
    this.showAddDocumentDialog = false;
  }

  addDocument(document: Document) {
    if (this.selectedDossier) {
      if (!this.selectedDossier.documents) {
        this.selectedDossier.documents = [];
      }
      document.date = new Date();
      document.clientId = this.selectedDossier.clientId;
      document.dossierId = this.selectedDossier.id;
      this.selectedDossier.documents.push(document);
      this.refreshDocuments();

      if (this.selectedDossier.id) {
        this.dossierService.update(this.selectedDossier).subscribe({
          next: () => {
            this.alertService.success('Document ajouté avec succès');
            this.closeDocumentDialog();
          },
          error: (err) => {
            console.error('Error updating dossier:', err);
          }
        });
      }
    }
  }

  async deleteDocument(index: number) {
    const confirmed = await this.alertService.confirmMessage(
      'Suppression',
      'Voulez-vous vraiment supprimer ce document ?',
      'warning'
    );

    if (confirmed && this.selectedDossier && this.selectedDossier.documents) {
      this.selectedDossier.documents.splice(index, 1);
      this.refreshDocuments();

      if (this.selectedDossier.id) {
        this.dossierService.update(this.selectedDossier).subscribe({
          next: () => {
            this.alertService.success('Document supprimé');
          }
        });
      }
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
  get paginatedDocuments() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.documents.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.documents.length / this.pageSize);
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

}
