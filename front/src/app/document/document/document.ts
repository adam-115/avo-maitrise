import { DocumentDialog } from './../document-dialog/document-dialog';
import { Component, ViewChild } from '@angular/core';

@Component({
  selector: 'app-document',
  imports: [DocumentDialog],
  templateUrl: './document.html',
  styleUrl: './document.css'
})
export class Document {

  showAddDocumentDialog = false ;



  // @ViewChild(DocumentDialog)
  // documentDialog!: DocumentDialog;

  openDocumentDialog() {
    // this.documentDialog.openModal();
    this.showAddDocumentDialog = true;
  }

  closeDocumentDialog() {
    this.showAddDocumentDialog = false ;
  }

}
