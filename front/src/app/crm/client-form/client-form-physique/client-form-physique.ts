import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Document } from '../../../appTypes';
import { DocumentDialog } from "../../../document/document-dialog/document-dialog";

@Component({
  selector: 'app-client-form-physique',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DocumentDialog],
  templateUrl: './client-form-physique.html',
  styleUrl: './client-form-physique.css',
})
export class ClientFormPhysique {

  showUploadDocumentDialog = false;
  documents: Document[] = [];


  contacts = [
    { nom: 'adam', fonction: 'manager', email: 'adam.laftimi@company.com', tel: '+352691209800' }
  ];

  addContact() {
    this.contacts.push({ nom: '', fonction: '', email: '', tel: '' });
  }

  removeContact(index: number) {
    if (this.contacts.length > 1) {
      this.contacts.splice(index, 1);
    }
  }


  openAddDocumentDialog() {
    this.showUploadDocumentDialog = true;
  }

  deleteDocument(id?: number) {
    // Logique de suppression (filtrer le tableau ou appel API)
    this.documents = this.documents.filter(d => d.id !== id);
  }

  downloadDoc(doc: Document) {
    // Création d'un lien temporaire pour télécharger le fichier stocké dans l'objet
    const url = window.URL.createObjectURL(doc.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    a.click();
  }

  onAddDocument(document: Document) {
    this.documents.push(document);
    this.onCloseDocumentDialog();
  }

  onCloseDocumentDialog() {
    this.showUploadDocumentDialog = false;
  }






}
