import { Component, EventEmitter, Input, OnInit, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Task, TaskCategory, TaskStatus, User, TaskLog } from '../../../appTypes';
import { UserSelectionDialog } from '../../user-selection-dialog/user-selection-dialog';
import { TaskLogService } from '../../../services/task-log.service';
import { PaginatedResponse } from '../../../services/genericService/abstract-crud.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, UserSelectionDialog, TranslatePipe],
  templateUrl: './task-dialog.component.html'
})
export class TaskDialogComponent implements OnInit, OnChanges {
  @Input() isEditing: boolean = false;
  @Input() taskToEdit?: Task;
  @Input() categories: TaskCategory[] = [];
  @Input() statuses: TaskStatus[] = [];
  @Input() users: User[] = [];
  @Input() isViewOnly: boolean = false;

  @Output() closeDialog = new EventEmitter<void>();
  @Output() saveTask = new EventEmitter<any>();

  taskForm!: FormGroup;
  showUserDialog: boolean = false;
  activeTab: 'DETAILS' | 'COMMENTS' = 'DETAILS';
  currentTaskLogs: TaskLog[] = [];
  commentText: string = '';
  isSubmitting: boolean = false;

  private fb = inject(FormBuilder);
  private taskLogService = inject(TaskLogService);

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

  populateForm(): void {
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

  onClose(): void {
    this.closeDialog.emit();
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      this.isSubmitting = true;
      this.saveTask.emit(this.taskForm.getRawValue());
      this.isSubmitting = false;
    } else {
      this.taskForm.markAllAsTouched();
    }
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
