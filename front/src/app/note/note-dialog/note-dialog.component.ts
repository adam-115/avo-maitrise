import { Component, EventEmitter, HostListener, inject, Input, OnInit, OnChanges, OnDestroy, SimpleChanges, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Note, NoteCategory } from '../../appTypes';
import { NoteCategoryService } from '../../services/note-category.service';
import { VoiceNoteService } from '../../services/voice-note.service';
import { DocumentService } from '../../services/document.service';
import { WordExportService } from '../../services/word-export.service';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';

@Component({
  selector: 'app-note-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, TranslatePipe],
  templateUrl: './note-dialog.component.html',
  styleUrl: './note-dialog.component.css'
})
export class NoteDialogComponent implements OnInit, OnChanges, OnDestroy {
  private noteCategoryService = inject(NoteCategoryService);
  private documentService = inject(DocumentService);
  private wordExportService = inject(WordExportService);
  public voiceService = inject(VoiceNoteService);

  isDictating = false;
  dictationInterim = '';
  dictationError = '';
  isSubmitting = false;
  isExportingWord = false;
  validationSummary: string | null = null;

  recordedAudioBlob: Blob | null = null;
  recordedAudioMime = 'audio/webm';
  recordedAudioPreviewUrl: string | null = null;

  noteAudioUrl: string | null = null;
  isLoadingNoteAudio = false;
  noteAudioError: string | null = null;

  @Input() categories: NoteCategory[] = [];
  @Input() dossierId: string | number = '';
  @Input() auteurId: string | number = '';
  @Input() noteToEdit: Note | null = null;
  @Input() isViewOnly: boolean = false;
  @Input() authorName: string = '';

  @Output() closeDialog = new EventEmitter<void>();
  @Output() saveNote = new EventEmitter<Note>();
  @Output() noteCreated = new EventEmitter<Note>();
  @Output() noteUpdated = new EventEmitter<Note>();
  @Output() closeModalEvent = new EventEmitter<void>();

  noteForm!: FormGroup;

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    this.onClose();
  }

  ngOnInit(): void {
    this.initForm();
    if (!this.categories || this.categories.length === 0) {
      this.loadCategories();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.noteForm) {
      this.initForm();
    }
    if (changes['noteToEdit'] || changes['isViewOnly']) {
      this.populateForm();
    }
  }

  private initForm(): void {
    this.noteForm = new FormGroup({
      title: new FormControl('', [Validators.required, Validators.minLength(2)]),
      description: new FormControl('', [Validators.required, Validators.minLength(2)]),
      categoryId: new FormControl('', [Validators.required])
    });
    this.populateForm();
  }

  private populateForm(): void {
    if (!this.noteForm) return;
    this.validationSummary = null;
    this.revokeAllAudioUrls();
    this.recordedAudioBlob = null;
    this.noteAudioError = null;

    if (this.noteToEdit) {
      this.noteForm.patchValue({
        title: this.noteToEdit.title,
        description: this.noteToEdit.description || '',
        categoryId: this.noteToEdit.categoryId || ''
      });
      if (this.getNoteAudioDocId()) {
        this.loadNoteAudio();
      }
    } else {
      const defaultCat = this.categories && this.categories.length > 0 ? this.categories[0].id : '';
      this.noteForm.reset({
        title: '',
        description: '',
        categoryId: defaultCat
      });
    }

    if (this.isViewOnly) {
      this.noteForm.disable();
    } else {
      this.noteForm.enable();
    }
  }

  getNoteAudioDocId(): number | null {
    return (this.noteToEdit as any)?.audioDocumentId ?? null;
  }

  getSelectedCategoryLabel(): string {
    const id = this.noteToEdit?.categoryId ?? this.noteForm?.get('categoryId')?.value;
    const cat = this.categories.find(c => String(c.id) === String(id));
    return cat?.label || 'Sans catégorie';
  }

  getSelectedCategoryColor(): string {
    const id = this.noteToEdit?.categoryId ?? this.noteForm?.get('categoryId')?.value;
    const cat = this.categories.find(c => String(c.id) === String(id));
    return cat?.color || '#10b981';
  }

  switchToEditMode(): void {
    this.isViewOnly = false;
    this.noteForm.enable();
  }

  exportToWord(): void {
    if (!this.noteToEdit?.id || this.isExportingWord) return;
    this.isExportingWord = true;
    const safeTitle = (this.noteToEdit.title || `Note_${this.noteToEdit.id}`).replace(/[^a-zA-Z0-9._-]/g, '_');
    this.wordExportService.downloadNote(this.noteToEdit.id, `Note_${safeTitle}.docx`).subscribe({
      next: () => { this.isExportingWord = false; },
      error: () => { this.isExportingWord = false; }
    });
  }

  loadNoteAudio(): void {
    const docId = this.getNoteAudioDocId();
    if (!docId || this.isLoadingNoteAudio || this.noteAudioUrl) return;
    this.isLoadingNoteAudio = true;
    this.noteAudioError = null;
    this.documentService.downloadDocumentFile(docId).subscribe({
      next: blob => {
        this.noteAudioUrl = URL.createObjectURL(blob);
        this.isLoadingNoteAudio = false;
      },
      error: () => {
        this.noteAudioError = 'Impossible de charger l\'enregistrement audio.';
        this.isLoadingNoteAudio = false;
      }
    });
  }

  private revokeAllAudioUrls(): void {
    if (this.noteAudioUrl) {
      URL.revokeObjectURL(this.noteAudioUrl);
      this.noteAudioUrl = null;
    }
    if (this.recordedAudioPreviewUrl) {
      URL.revokeObjectURL(this.recordedAudioPreviewUrl);
      this.recordedAudioPreviewUrl = null;
    }
  }

  discardRecordedAudio(): void {
    if (this.recordedAudioPreviewUrl) {
      URL.revokeObjectURL(this.recordedAudioPreviewUrl);
      this.recordedAudioPreviewUrl = null;
    }
    this.recordedAudioBlob = null;
  }

  loadCategories(): void {
    this.noteCategoryService.getAll().subscribe({
      next: (res: PaginatedResponse<NoteCategory>) => {
        this.categories = res.content || (Array.isArray(res) ? res : []);
        if (!this.noteToEdit && this.categories.length > 0 && !this.noteForm.get('categoryId')?.value) {
          this.noteForm.patchValue({ categoryId: this.categories[0].id });
        }
      },
      error: () => {}
    });
  }

  get isEditing(): boolean {
    return !!this.noteToEdit && !!this.noteToEdit.id;
  }

  ngOnDestroy(): void {
    this.voiceService.stopRecognition();
    this.voiceService.stopAudioRecording();
    this.revokeAllAudioUrls();
  }

  toggleDictation(): void {
    if (this.isDictating) {
      this.voiceService.stopRecognition();
      this.voiceService.stopAudioRecording();
      this.isDictating = false;
      this.dictationInterim = '';
      return;
    }
    this.dictationError = '';
    this.discardRecordedAudio();
    this.voiceService.startAudioRecording((blob, mime) => {
      this.recordedAudioBlob = blob;
      this.recordedAudioMime = mime;
      this.recordedAudioPreviewUrl = URL.createObjectURL(blob);
    });
    const started = this.voiceService.startRecognition('fr-FR', {
      onFinal: chunk => {
        const current = (this.noteForm.get('description')?.value || '').trim();
        this.noteForm.patchValue({ description: current ? `${current} ${chunk}` : chunk });
        if (!this.noteForm.get('title')?.value) {
          this.noteForm.patchValue({ title: chunk.length > 75 ? chunk.substring(0, 75) + '…' : chunk });
        }
        this.dictationInterim = '';
      },
      onInterim: text => {
        this.dictationInterim = text;
      },
      onError: msg => {
        this.dictationError = msg;
        this.isDictating = false;
        this.dictationInterim = '';
        this.voiceService.stopAudioRecording();
      },
      onEnd: () => {
        this.isDictating = false;
        this.dictationInterim = '';
        this.voiceService.stopAudioRecording();
      }
    });
    this.isDictating = started;
  }

  onClose(): void {
    this.voiceService.stopRecognition();
    this.voiceService.stopAudioRecording();
    this.revokeAllAudioUrls();
    this.closeDialog.emit();
    this.closeModalEvent.emit();
  }

  async onSubmit(): Promise<void> {
    this.validationSummary = null;
    if (this.noteForm.invalid || this.isSubmitting) {
      this.noteForm.markAllAsTouched();
      if (this.noteForm.invalid) {
        const labels: Record<string, string> = {
          categoryId: 'Catégorie',
          title: 'Titre (min. 2 caractères)',
          description: 'Contenu de la note (min. 2 caractères)'
        };
        const missing = Object.keys(labels)
          .filter(k => this.noteForm.get(k)?.invalid)
          .map(k => labels[k]);
        this.validationSummary = `Champs obligatoires manquants : ${missing.join(', ')}.`;
      }
      return;
    }

    this.isSubmitting = true;
    const formVal = this.noteForm.getRawValue();
    let audioDocumentId: number | null = this.getNoteAudioDocId();

    if (this.recordedAudioBlob && this.dossierId) {
      try {
        const b64 = await this.voiceService.blobToBase64(this.recordedAudioBlob);
        const ext = this.recordedAudioMime.includes('mp4') ? 'm4a' : (this.recordedAudioMime.includes('ogg') ? 'ogg' : 'webm');
        const stamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 16);
        const docPayload: any = {
          dossierId: Number(this.dossierId),
          nomFichier: `Dictee_note_${stamp}.${ext}`,
          description: `Enregistrement vocal (note) : ${formVal.title || ''}`,
          fileData: b64
        };
        audioDocumentId = await new Promise<number | null>(resolve => {
          this.documentService.create(docPayload).subscribe({
            next: (createdDoc: any) => resolve(createdDoc?.id ? Number(createdDoc.id) : audioDocumentId),
            error: () => resolve(audioDocumentId)
          });
        });
      } catch {
        // Fallback : enregistrer la note sans l'audio
      }
    }

    const noteData: any = {
      id: this.noteToEdit?.id,
      title: formVal.title,
      description: formVal.description,
      categoryId: formVal.categoryId,
      dossierId: this.dossierId,
      auteurId: this.auteurId,
      audioDocumentId,
      createdAt: this.noteToEdit ? this.noteToEdit.createdAt : new Date(),
      updatedAt: new Date()
    };

    this.isSubmitting = false;
    this.saveNote.emit(noteData);
    this.onClose();
  }
}
