import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentDialog } from '../../document/document-dialog/document-dialog';
import { Document } from '../../appTypes';
import { DocumentService } from '../../services/document.service';
import { AlertService } from '../../services/alert-service';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-model',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentDialog, TranslatePipe],
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

  viewMode: 'grid' | 'table' = 'grid';

  showDocumentDialog = false;
  selectedDocument: Document | null = null;
  dialogTitle = "Ajouter un Nouveau Modèle";

  constructor() { }

  ngOnInit(): void {
    this.loadModels();
  }

  get contractsCount(): number {
    return this.documents.filter(d => (d.tags || '').toUpperCase().includes('CONTRACT')).length;
  }

  get kycCount(): number {
    return this.documents.filter(d => (d.tags || '').toUpperCase().includes('KYC')).length;
  }

  get policiesCount(): number {
    return this.documents.filter(d => {
      const tag = (d.tags || '').toUpperCase();
      return tag.includes('POLICY') || tag.includes('INTERNAL');
    }).length;
  }

  get isFiltered(): boolean {
    return !!(this.searchTerm.trim() || this.selectedCategory || this.selectedStatus);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.applyFilters();
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
        (doc.nomFichier || '').toLowerCase().includes(search) ||
        (doc.filename || '').toLowerCase().includes(search)
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
      case 'CONTRACT': return 'MODEL.CONTRACTS';
      case 'KYC_FORM': return 'MODEL.KYC_FORMS';
      case 'POLICY': return 'MODEL.POLICIES';
      case 'INTERNAL': return 'MODEL.INTERNAL_DOCS';
      default: return categoryCode ? categoryCode : 'MODEL.ALL_CATEGORIES';
    }
  }

  getCategoryBadgeClass(categoryCode: string): string {
    switch (categoryCode) {
      case 'CONTRACT':
        return 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-500/10';
      case 'KYC_FORM':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/10';
      case 'POLICY':
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/10';
      case 'INTERNAL':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/10';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 ring-1 ring-slate-500/10';
    }
  }

  getFileExtension(doc: Document): string {
    const filename = doc.nomFichier || doc.filename || doc.name || '';
    const parts = filename.split('.');
    if (parts.length > 1) {
      return parts.pop()!.toUpperCase();
    }
    return 'DOC';
  }
}
