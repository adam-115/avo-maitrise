import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentDialog } from '../../document/document-dialog/document-dialog';
import { Document } from '../../appTypes';
import { DocumentService } from '../../services/document.service';
import { AlertService } from '../../services/alert-service';

import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';

@Component({
  selector: 'app-model',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentDialog, TranslatePipe, TranslateDirective],
  templateUrl: './model.html',
  styleUrl: './model.css'
})
export class Model implements OnInit {
  private documentService = inject(DocumentService);
  private alertService = inject(AlertService);

  documents: Document[] = [];
  filteredDocuments: Document[] = [];

  searchTerm: string = '';
  selectedCategory: string = '';
  selectedStatus: string = '';

  showDocumentDialog = false;
  selectedDocument: Document | null = null;
  dialogTitle = "Ajouter un Nouveau Modèle";

  constructor() { }

  ngOnInit(): void {
    this.loadModels();
  }

  loadModels(): void {
    this.documentService.getByType('MODEL', 0, 1000).subscribe({
      next: (response) => {
        this.documents = response.content || [];
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error fetching models:', err);
        this.alertService.displayMessage('Erreur', 'Impossible de charger les modèles de documents', 'error');
      }
    });
  }

  applyFilters(): void {
    let temp = [...this.documents];

    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      temp = temp.filter(doc => 
        (doc.title || '').toLowerCase().includes(search) || 
        (doc.description || '').toLowerCase().includes(search) ||
        (doc.nomFichier || '').toLowerCase().includes(search)
      );
    }

    if (this.selectedCategory) {
      temp = temp.filter(doc => (doc.tags || '') === this.selectedCategory);
    }

    if (this.selectedStatus) {
      const activeFilter = this.selectedStatus === 'ACTIVE';
      temp = temp.filter(doc => (doc.estValide !== false) === activeFilter);
    }

    this.filteredDocuments = temp;
  }

  openCreateDialog(): void {
    this.selectedDocument = null;
    this.dialogTitle = "Ajouter un Nouveau Modèle";
    this.showDocumentDialog = true;
  }

  openEditDialog(doc: Document): void {
    this.selectedDocument = doc;
    this.dialogTitle = "Modifier le Modèle";
    this.showDocumentDialog = true;
  }

  closeDialog(): void {
    this.showDocumentDialog = false;
    this.selectedDocument = null;
  }

  saveDocument(doc: Document): void {
    // Standard template classification: no client, no dossier, active by default
    doc.clientId = undefined;
    doc.dossierId = undefined;
    doc.estValide = true;

    // Use tags field to persist selectedCategory if set
    if (this.selectedCategory) {
      doc.tags = this.selectedCategory;
    }

    if (this.selectedDocument && this.selectedDocument.id) {
      // Edit mode
      doc.id = this.selectedDocument.id;
      this.documentService.update(doc).subscribe({
        next: () => {
          this.loadModels();
          this.alertService.success('Modèle mis à jour avec succès');
          this.closeDialog();
        },
        error: (err) => {
          console.error('Error updating model:', err);
          this.alertService.displayMessage('Erreur', 'Impossible de modifier le modèle', 'error');
        }
      });
    } else {
      // Creation mode
      this.documentService.create(doc).subscribe({
        next: () => {
          this.loadModels();
          this.alertService.success('Modèle ajouté avec succès');
          this.closeDialog();
        },
        error: (err) => {
          console.error('Error creating model:', err);
          this.alertService.displayMessage('Erreur', 'Impossible d\'ajouter le modèle', 'error');
        }
      });
    }
  }

  async deleteModel(doc: Document): Promise<void> {
    if (!doc.id) return;

    const confirmed = await this.alertService.confirmMessage(
      'Suppression',
      'Voulez-vous vraiment supprimer ce modèle ?',
      'warning'
    );

    if (confirmed) {
      this.documentService.delete(doc.id).subscribe({
        next: () => {
          this.loadModels();
          this.alertService.success('Modèle supprimé avec succès');
        },
        error: (err) => {
          console.error('Error deleting model:', err);
          this.alertService.displayMessage('Erreur', 'Impossible de supprimer le modèle', 'error');
        }
      });
    }
  }

  downloadModel(doc: Document): void {
    if (!doc.fileData) {
      this.alertService.displayMessage('Erreur', 'Aucune donnée de fichier disponible pour ce modèle', 'error');
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
      a.download = doc.filename || doc.nomFichier || 'modele_document';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      this.alertService.displayMessage('Erreur', 'Impossible de décoder le fichier pour le téléchargement', 'error');
    }
  }

  getCategoryLabel(categoryCode: string): string {
    switch (categoryCode) {
      case 'CONTRACT': return 'Modèles de Contrats';
      case 'KYC_FORM': return 'Formulaires KYC';
      case 'POLICY': return 'Politiques Internes';
      case 'INTERNAL': return 'Documents de Travail';
      default: return 'Général / Autre';
    }
  }
}
