import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Document } from '../../appTypes';
import { DocumentService } from '../../services/document.service';
import { AlertService } from '../../services/alert-service';

@Component({
  selector: 'app-jurisprudence-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './jurisprudence-management.html'
})
export class JurisprudenceManagement implements OnInit {
  
  countries: string[] = ['FRANCE', 'LUXEMBOURG', 'BELGIQUE', 'ALLEMAGNE', 'SUISSE', 'INTERNATIONAL'];
  selectedCountry: string = 'LUXEMBOURG';
  
  documents: Document[] = [];
  isLoading = false;
  
  showUploadModal = false;
  newDocTitle = '';
  newDocCountry = 'LUXEMBOURG';
  selectedFile: File | null = null;
  selectedFileBase64: string | null = null;

  documentService = inject(DocumentService);
  alertService = inject(AlertService);

  ngOnInit() {
    this.loadDocuments();
  }

  loadDocuments() {
    this.isLoading = true;
    this.documentService.getJurisprudence(this.selectedCountry).subscribe({
      next: (res: any) => {
        this.documents = res.content || res || [];
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error fetching jurisprudence:', err);
        this.isLoading = false;
      }
    });
  }

  onCountryChange(country: string) {
    this.selectedCountry = country;
    this.loadDocuments();
  }

  openUploadModal() {
    this.newDocTitle = '';
    this.newDocCountry = this.selectedCountry;
    this.selectedFile = null;
    this.selectedFileBase64 = null;
    this.showUploadModal = true;
  }

  closeUploadModal() {
    this.showUploadModal = false;
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      if (!this.newDocTitle) {
        this.newDocTitle = file.name.split('.')[0];
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        this.selectedFileBase64 = base64String;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadDocument() {
    if (!this.selectedFile || !this.selectedFileBase64 || !this.newDocTitle) {
      this.alertService.displayMessage('Erreur', 'Veuillez remplir le titre et sélectionner un fichier.', 'error');
      return;
    }

    const docToSave: Document = {
      nomFichier: this.selectedFile.name,
      filename: this.selectedFile.name,
      title: this.newDocTitle,
      pays: this.newDocCountry,
      typeDocument: 'JURISPRUDENCE',
      dateUpload: new Date(),
      fileData: this.selectedFileBase64
    };

    this.documentService.create(docToSave).subscribe({
      next: () => {
        this.alertService.success('Jurisprudence ajoutée avec succès !');
        this.closeUploadModal();
        if (this.selectedCountry === this.newDocCountry) {
          this.loadDocuments();
        } else {
          this.selectedCountry = this.newDocCountry;
          this.loadDocuments();
        }
      },
      error: (err: any) => {
        console.error('Erreur upload:', err);
        this.alertService.displayMessage('Erreur', 'Impossible de sauvegarder le document.', 'error');
      }
    });
  }

  async deleteDocument(doc: Document) {
    const confirmed = await this.alertService.confirmMessage('Suppression', 'Voulez-vous vraiment supprimer ce document de jurisprudence ?', 'warning');
    if (confirmed && doc.id) {
      this.documentService.delete(doc.id).subscribe({
        next: () => {
          this.alertService.success('Document supprimé.');
          this.loadDocuments();
        },
        error: (err: any) => {
          console.error(err);
          this.alertService.displayMessage('Erreur', 'Erreur de suppression.', 'error');
        }
      });
    }
  }

  downloadDocument(doc: Document) {
    if (!doc.fileData) {
      this.alertService.displayMessage('Erreur', 'Fichier introuvable.', 'error');
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
      a.download = doc.filename || doc.nomFichier || doc.title || 'jurisprudence.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      this.alertService.displayMessage('Erreur', 'Erreur de téléchargement.', 'error');
    }
  }
}
