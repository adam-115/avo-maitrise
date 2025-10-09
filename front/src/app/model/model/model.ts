import { UploadFileModal } from './../upload-file-modal/upload-file-modal';
import { Component, ViewChild } from '@angular/core';

@Component({
  selector: 'app-model',
  imports: [UploadFileModal],
  templateUrl: './model.html',
  styleUrl: './model.css'
})
export class Model {
 @ViewChild(UploadFileModal)
  uploadFileModal!: UploadFileModal;

  constructor() { }

  openUploadModal() {
    this.uploadFileModal.openModal();
  }
  closeUploadModal() {
    this.uploadFileModal.closeModal();
  }


}
