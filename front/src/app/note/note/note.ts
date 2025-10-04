import { Component, ViewChild } from '@angular/core';
import { NoteDialog } from '../note-dialog/note-dialog';

@Component({
  selector: 'app-note',
  imports: [NoteDialog],
  templateUrl: './note.html',
  styleUrl: './note.css'
})
export class Note {

  @ViewChild(NoteDialog)
  noteDialog!: NoteDialog;

  openNoteCreationModal() {
    this.noteDialog.openModal();
  }
  closeNoteCreationModal() {
    this.noteDialog.closeModal();
  }


}
