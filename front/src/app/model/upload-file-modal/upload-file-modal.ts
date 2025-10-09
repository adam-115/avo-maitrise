import { Component } from '@angular/core';

@Component({
  selector: 'app-upload-file-modal',
  imports: [],
  templateUrl: './upload-file-modal.html',
  styleUrl: './upload-file-modal.css'
})
export class UploadFileModal {
  showModal: boolean = false;

  constructor() { }

  openModal() {
    this.showModal = true;
  }
  closeModal() {
    this.showModal = false;
  }





}
