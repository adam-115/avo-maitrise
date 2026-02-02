import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Document } from '../../appTypes';
import { DocumentDialog } from "../../document/document-dialog/document-dialog";

@Component({
    selector: 'app-client-documents',
    standalone: true,
    imports: [CommonModule, FormsModule, DocumentDialog],
    templateUrl: './client-documents.html',
    styleUrl: './client-documents.css'
})
export class ClientDocumentsComponent {

    @Input() documents: Document[] = [];
    @Output() documentsChange = new EventEmitter<Document[]>();

    showUploadDocumentDialog = false;

    openAddDocumentDialog() {
        this.showUploadDocumentDialog = true;
    }

    deleteDocument(id?: number) {
        this.documents = this.documents.filter(d => d.id !== id);
        this.documentsChange.emit(this.documents);
    }

    downloadDoc(doc: Document) {
        const url = window.URL.createObjectURL(doc.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name;
        a.click();
    }

    onAddDocument(document: Document) {
        this.documents.push(document);
        this.documentsChange.emit(this.documents);
        this.onCloseDocumentDialog();
    }

    onCloseDocumentDialog() {
        this.showUploadDocumentDialog = false;
    }
}
