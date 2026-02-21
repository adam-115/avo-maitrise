import { Component, inject, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentDialog } from '../document-dialog/document-dialog';
import { Dossier, Document } from '../../appTypes';
import { DocumentService } from '../../services/document.service';
import { ClientService } from '../../services/client-service';
import { DossierService } from '../../services/dossier.service';

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

  ngOnInit(): void {
    this.documents = this.selectedDossier?.documents || [];
  }

  getAllDossierDocuments() {
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
      this.selectedDossier.documents.push(document);
      this.documents = this.selectedDossier.documents;

      if (this.selectedDossier.id) {
        this.dossierService.update(this.selectedDossier.id, this.selectedDossier).subscribe({
          next: () => {
            console.log('Dossier updated successfully with new document');
            this.closeDocumentDialog();
          },
          error: (err) => {
            console.error('Error updating dossier:', err);
          }
        });
      }
    }
  }

}
