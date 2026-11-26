import { Component, EventEmitter, HostListener, Input, OnInit, OnChanges, OnDestroy, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Task, TaskCategory, TaskStatus, User, TaskLog } from '../../../appTypes';
import { UserSelectionDialog } from '../../user-selection-dialog/user-selection-dialog';
import { TaskLogService } from '../../../services/task-log.service';
import { VoiceNoteService } from '../../../services/voice-note.service';
import { DocumentService } from '../../../services/document.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, UserSelectionDialog, TranslatePipe],
  templateUrl: './task-dialog.component.html'
})
export class TaskDialogComponent implements OnInit, OnChanges, OnDestroy {
  @Input() isEditing: boolean = false;
  @Input() taskToEdit?: Task;
  @Input() categories: TaskCategory[] = [];
  @Input() statuses: TaskStatus[] = [];
  @Input() users: User[] = [];
  @Input() isViewOnly: boolean = false;
  @Input() dossierId?: string | number;

  @Output() closeDialog = new EventEmitter<void>();
  @Output() saveTask = new EventEmitter<any>();

  taskForm!: FormGroup;
  showUserDialog: boolean = false;
  activeTab: 'DETAILS' | 'COMMENTS' = 'DETAILS';
  currentTaskLogs: TaskLog[] = [];
  commentText: string = '';
  isSubmitting: boolean = false;
  validationSummary: string | null = null;

  private fb = inject(FormBuilder);
  private taskLogService = inject(TaskLogService);
  private documentService = inject(DocumentService);
  public voiceService = inject(VoiceNoteService);

  isDictating = false;
  dictationInterim = '';
  dictationError = '';

  recordedAudioBlob: Blob | null = null;
  recordedAudioMime = 'audio/webm';
  recordedAudioPreviewUrl: string | null = null;

  taskAudioUrl: string | null = null;
  isLoadingTaskAudio = false;
  taskAudioError: string | null = null;

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (!this.showUserDialog) {
      this.onClose();
    }
  }

  ngOnInit(): void {
    this.initForm();
    this.populateForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.taskForm) {
      this.initForm();
    }
    if ((changes['taskToEdit'] || changes['isEditing']) && this.taskForm) {
      this.populateForm();
    }
  }

  initForm(): void {
    this.taskForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      categoryId: ['', Validators.required],
      statusId: ['', Validators.required],
      priorite: ['NORMALE', Validators.required],
      assigneAIds: [[]],
      dateEcheance: [new Date().toISOString().split('T')[0], Validators.required],
      estimatedTimeMinutes: [null]
    });
  }

  setPriority(priority: 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE'): void {
    if (this.isViewOnly) return;
    this.taskForm.patchValue({ priorite: priority });
  }

  populateForm(): void {
    this.validationSummary = null;
    this.revokeAllAudioUrls();
    this.recordedAudioBlob = null;
    this.taskAudioError = null;
    if (this.isEditing && this.taskToEdit) {
      const echeance = this.taskToEdit.dateEcheance
        ? new Date(this.taskToEdit.dateEcheance).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      this.taskForm.patchValue({
        titre: this.taskToEdit.titre,
        description: this.taskToEdit.description || '',
        categoryId: this.taskToEdit.category?.id || '',
        statusId: this.taskToEdit.status?.id || '',
        priorite: this.taskToEdit.priorite || 'NORMALE',
        assigneAIds: (this.taskToEdit.assignees || []).map(u => String(u.id)),
        dateEcheance: echeance,
        estimatedTimeMinutes: this.taskToEdit.estimatedTimeMinutes || null
      });
      this.loadLogs();
      if (this.taskToEdit.audioDocumentId) {
        this.loadTaskAudio();
      }
    } else {
      const defaultCat = this.categories.length > 0 ? this.categories[0].id : '';
      const defaultStatus = this.statuses.length > 0 ? this.statuses[0].id : '';
      this.taskForm.patchValue({
        categoryId: defaultCat,
        statusId: defaultStatus,
        priorite: 'NORMALE',
        assigneAIds: [],
        dateEcheance: new Date().toISOString().split('T')[0]
      });
    }

    if (this.isViewOnly) {
      this.taskForm.disable();
    } else {
      this.taskForm.enable();
    }
  }

  openUserDialog(): void {
    if (this.isViewOnly) return;
    this.showUserDialog = true;
  }

  closeUserDialog(): void {
    this.showUserDialog = false;
  }

  onUsersSelected(selectedIds: string[]): void {
    this.taskForm.patchValue({ assigneAIds: selectedIds });
    this.closeUserDialog();
  }

  getSelectedAssignees(): User[] {
    const selectedIds = (this.taskForm.get('assigneAIds')?.value || []).map((id: any) => String(id));
    return this.users.filter(user => selectedIds.includes(String(user.id)));
  }

  getUserInitials(user: User): string {
    if (!user) return '?';
    const first = user.firstName ? user.firstName.charAt(0) : '';
    const last = user.lastName ? user.lastName.charAt(0) : '';
    return (first + last).toUpperCase() || (user.username ? user.username.substring(0, 2).toUpperCase() : '?');
  }

  getUserFullName(user: User): string {
    if (!user) return '';
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.username || '';
  }

  removeAssignee(userId: string | number): void {
    if (this.isViewOnly) return;
    const currentIds = this.taskForm.get('assigneAIds')?.value || [];
    const newIds = currentIds.filter((id: string | number) => String(id) !== String(userId));
    this.taskForm.patchValue({ assigneAIds: newIds });
  }

  ngOnDestroy(): void {
    this.voiceService.stopRecognition();
    this.voiceService.stopAudioRecording();
    this.revokeAllAudioUrls();
  }

  private revokeAllAudioUrls(): void {
    if (this.taskAudioUrl) {
      URL.revokeObjectURL(this.taskAudioUrl);
      this.taskAudioUrl = null;
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

  loadTaskAudio(): void {
    const docId = this.taskToEdit?.audioDocumentId;
    if (!docId || this.isLoadingTaskAudio || this.taskAudioUrl) return;
    this.isLoadingTaskAudio = true;
    this.taskAudioError = null;
    this.documentService.downloadDocumentFile(docId).subscribe({
      next: blob => {
        this.taskAudioUrl = URL.createObjectURL(blob);
        this.isLoadingTaskAudio = false;
      },
      error: () => {
        this.taskAudioError = 'Impossible de charger l\'enregistrement audio.';
        this.isLoadingTaskAudio = false;
      }
    });
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
        const current = (this.taskForm.get('description')?.value || '').trim();
        this.taskForm.patchValue({ description: current ? `${current} ${chunk}` : chunk });
        if (!this.taskForm.get('titre')?.value) {
          this.taskForm.patchValue({ titre: chunk.length > 75 ? chunk.substring(0, 75) + '…' : chunk });
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
  }

  async onSubmit(): Promise<void> {
    this.validationSummary = null;
    if (!this.taskForm.valid) {
      this.taskForm.markAllAsTouched();
      const labels: Record<string, string> = {
        titre: 'Titre (min. 2 caractères)',
        categoryId: 'Catégorie',
        statusId: 'Statut',
        priorite: 'Priorité',
        dateEcheance: 'Date d\'échéance'
      };
      const missing = Object.keys(labels)
        .filter(k => this.taskForm.get(k)?.invalid)
        .map(k => labels[k]);
      this.validationSummary = `Champs obligatoires manquants : ${missing.join(', ')}.`;
      return;
    }
    this.isSubmitting = true;
    const raw = this.taskForm.getRawValue();
    let audioDocumentId: number | null = this.taskToEdit?.audioDocumentId ?? null;

    if (this.recordedAudioBlob && this.dossierId) {
      try {
        const b64 = await this.voiceService.blobToBase64(this.recordedAudioBlob);
        const ext = this.recordedAudioMime.includes('mp4') ? 'm4a' : (this.recordedAudioMime.includes('ogg') ? 'ogg' : 'webm');
        const stamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 16);
        const docPayload: any = {
          dossierId: Number(this.dossierId),
          nomFichier: `Dictee_tache_${stamp}.${ext}`,
          description: `Enregistrement vocal (tâche) : ${raw.titre || ''}`,
          fileData: b64
        };
        audioDocumentId = await new Promise<number | null>(resolve => {
          this.documentService.create(docPayload).subscribe({
            next: (createdDoc: any) => resolve(createdDoc?.id ? Number(createdDoc.id) : audioDocumentId),
            error: () => resolve(audioDocumentId)
          });
        });
      } catch {
        // Fallback : sauvegarder la tâche sans l'audio
      }
    }

    this.saveTask.emit({ ...raw, audioDocumentId });
    this.isSubmitting = false;
  }

  switchTab(tab: 'DETAILS' | 'COMMENTS'): void {
    this.activeTab = tab;
  }

  loadLogs(): void {
    if (!this.taskToEdit?.id) return;
    this.taskLogService.getAll().subscribe({
      next: (data) => {
        this.currentTaskLogs = (data.content || data || [])
          .filter((l: any) => String(l.taskId) === String(this.taskToEdit!.id))
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      error: () => {}
    });
  }

  addComment(): void {
    if (!this.taskToEdit?.id || !this.commentText.trim()) return;

    const newLog: TaskLog = {
      taskId: String(this.taskToEdit.id),
      action: 'COMMENT',
      description: this.commentText.trim(),
      createdAt: new Date(),
    };

    this.taskLogService.create(newLog).subscribe({
      next: () => {
        this.commentText = '';
        this.loadLogs();
      },
      error: () => {}
    });
  }
}
