import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Task, TaskCategory, TaskStatus, User, TaskLog } from '../../../appTypes';
import { UserSelectionDialog } from '../../user-selection-dialog/user-selection-dialog';
import { TaskLogService } from '../../../services/task-log.service';

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, UserSelectionDialog],
  templateUrl: './task-dialog.component.html'
})
export class TaskDialogComponent implements OnInit {
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

  private fb = inject(FormBuilder);
  private taskLogService = inject(TaskLogService);

  ngOnInit() {
    this.initForm();
    if (this.isEditing && this.taskToEdit) {
      this.taskForm.patchValue({
        titre: this.taskToEdit.titre,
        description: this.taskToEdit.description,
        categoryId: this.taskToEdit.categoryId,
        statusId: this.taskToEdit.statusId,
        priorite: this.taskToEdit.priorite,
        assigneAIds: (this.taskToEdit.assigneA || []).map(u => String(u.id)),
        dateEcheance: new Date(this.taskToEdit.dateEcheance).toISOString().split('T')[0],
        estimatedTimeMinutes: this.taskToEdit.estimatedTimeMinutes || null
      });
      this.loadLogs();
    } else {
      const defaultStatus = this.statuses.length > 0 ? this.statuses[0].id : '';
      this.taskForm.patchValue({
        statusId: defaultStatus
      });
    }

    if (this.isViewOnly) {
      this.taskForm.disable();
    }
  }

  initForm() {
    this.taskForm = this.fb.group({
      titre: ['', Validators.required],
      description: [''],
      categoryId: ['', Validators.required],
      statusId: ['', Validators.required],
      priorite: ['NORMALE', Validators.required],
      assigneAIds: [[]],
      dateEcheance: [new Date().toISOString().split('T')[0], Validators.required],
      estimatedTimeMinutes: [null]
    });
  }

  openUserDialog(): void {
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
    const selectedIds = this.taskForm.get('assigneAIds')?.value || [];
    return this.users.filter(user => selectedIds.includes(String(user.id)));
  }

  removeAssignee(userId: string | number): void {
    const currentIds = this.taskForm.get('assigneAIds')?.value || [];
    const newIds = currentIds.filter((id: string | number) => String(id) !== String(userId));
    this.taskForm.patchValue({ assigneAIds: newIds });
  }

  onClose() {
    this.closeDialog.emit();
  }

  onSubmit() {
    if (this.taskForm.valid) {
      this.saveTask.emit(this.taskForm.value);
    }
  }

  switchTab(tab: 'DETAILS' | 'COMMENTS') {
    this.activeTab = tab;
  }

  loadLogs() {
    if (!this.taskToEdit?.id) return;
    this.taskLogService.getAll().subscribe(logs => {
      this.currentTaskLogs = logs
        .filter(l => String(l.taskId) === String(this.taskToEdit!.id))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
  }

  addComment() {
    if (!this.taskToEdit?.id || !this.commentText.trim()) return;

    const newLog: TaskLog = {
      taskId: String(this.taskToEdit.id),
      action: 'COMMENT',
      description: this.commentText.trim(),
      createdAt: new Date(),
    };

    this.taskLogService.create(newLog).subscribe(() => {
      this.commentText = '';
      this.loadLogs();
    });
  }
}
