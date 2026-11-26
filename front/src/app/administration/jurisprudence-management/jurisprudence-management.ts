import { Component, OnInit, inject } from '@angular/core';
import { forkJoin, finalize } from 'rxjs';
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
  /** Upload en cours : bloque le double envoi et la fermeture de la fenêtre */
  isUploading = false;
  newDocTitle = '';
  newDocCountry = 'LUXEMBOURG';
  /** Décision de justice ou texte de loi (code, loi, règlement) */
  newDocType: 'JURISPRUDENCE' | 'LEGISLATION' = 'JURISPRUDENCE';
  // Fiche de la décision
  newDocJuridiction = '';
  newDocDateDecision = '';
  newDocNumero = '';
  newDocEcli = '';
  newDocSourceUrl = '';
  selectedFile: File | null = null;
  selectedFileBase64: string | null = null;

  documentService = inject(DocumentService);
  alertService = inject(AlertService);

  ngOnInit() {
    this.loadDocuments();
  }

  loadDocuments() {
    this.isLoading = true;
    // Décisions et textes de loi du pays : les deux forment la base légale consultée par l'IA
    forkJoin([
      this.documentService.getJurisprudence(this.selectedCountry, 0, 100, 'JURISPRUDENCE'),
      this.documentService.getJurisprudence(this.selectedCountry, 0, 100, 'LEGISLATION')
    ]).subscribe({
      next: ([jurisprudence, legislation]: any[]) => {
        this.documents = [...(legislation.content || []), ...(jurisprudence.content || [])];
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
    this.newDocType = 'JURISPRUDENCE';
    this.newDocCountry = this.selectedCountry;
    this.newDocJuridiction = '';
    this.newDocDateDecision = '';
    this.newDocNumero = '';
    this.newDocEcli = '';
    this.newDocSourceUrl = '';
    this.selectedFile = null;
    this.selectedFileBase64 = null;
    this.showUploadModal = true;
  }

  closeUploadModal() {
    if (this.isUploading) return;
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
    if (this.isUploading) return;
    if (!this.selectedFile || !this.selectedFileBase64 || !this.newDocTitle) {
      this.alertService.displayMessage('Erreur', 'Veuillez remplir le titre et sélectionner un fichier.', 'error');
      return;
    }

    const docToSave: Document = {
      nomFichier: this.selectedFile.name,
      filename: this.selectedFile.name,
      title: this.newDocTitle,
      pays: this.newDocCountry,
      juridiction: this.newDocJuridiction.trim() || undefined,
      dateDecision: this.newDocDateDecision || undefined,
      numeroDecision: this.newDocNumero.trim() || undefined,
      ecli: this.newDocEcli.trim() || undefined,
      sourceUrl: this.newDocSourceUrl.trim() || undefined,
      typeDocument: this.newDocType,
      dateUpload: new Date(),
      fileData: this.selectedFileBase64
    };

    this.isUploading = true;
    this.documentService.create(docToSave).pipe(
      finalize(() => this.isUploading = false)
    ).subscribe({
      next: () => {
        // L'indexation pour l'IA se poursuit en arrière-plan côté serveur
        this.isUploading = false;
        this.alertService.success('Document ajouté. La vectorisation se poursuit en arrière-plan.');
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
    if (doc.id) {
      this.documentService.downloadDocumentFile(doc.id).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = window.document.createElement('a');
          a.href = url;
          a.download = doc.filename || doc.nomFichier || doc.title || 'jurisprudence.pdf';
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error('Error downloading jurisprudence via stream', err);
          if (doc.urlStockage) {
            window.open(doc.urlStockage, '_blank');
          } else {
            this.alertService.displayMessage('Erreur', 'Erreur de téléchargement.', 'error');
          }
        }
      });
      return;
    }

    if (doc.urlStockage) {
      window.open(doc.urlStockage, '_blank');
      return;
    }

    if (!doc.fileData) {
      this.alertService.displayMessage('Erreur', 'Fichier ou URL introuvable.', 'error');
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
