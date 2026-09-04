import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Task, TaskCategory, TaskStatus, User, TaskLog } from '../../appTypes';
import { TaskService } from '../../services/task.service';
import { TaskCategoryService } from '../../services/task-category.service';
import { TaskStatusService } from '../../services/task-status.service';
import { TaskLogService } from '../../services/task-log.service';
import { UserService } from '../../services/user.service';
import { AlertService } from '../../services/alert-service';
import { TaskDialogComponent } from './task-dialog/task-dialog.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-task-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TaskDialogComponent, TranslatePipe],
  templateUrl: './task-manager.component.html',
  styleUrls: ['./task-manager.component.css']
})
export class TaskManagerComponent implements OnInit, OnChanges {
  @Input() dossierId!: string | number;
  @Input() selectedDossier: any = null;
  @Input() dossier: any = null;

  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  categories: TaskCategory[] = [];
  statuses: TaskStatus[] = [];
  users: User[] = [];
  taskLogsMap: { [key: number]: TaskLog[] } = {};
  taskTabs: { [key: number]: 'INFO' | 'LOGS' } = {};
  isLoading = false;

  showForm: boolean = false;
  isEditing: boolean = false;
  isViewOnlyMode: boolean = false;
  selectedTaskId: number | string | undefined = undefined;
  taskToEdit?: Task;

  // Pagination
  currentPage = 1;
  pageSize = 6;

  // Filters
  searchTerm: string = '';
  selectedCategoryId: string = '';
  selectedStatusId: string = '';
  showUrgentOnly: boolean = false;

  taskService = inject(TaskService);
  categoryService = inject(TaskCategoryService);
  statusService = inject(TaskStatusService);
  taskLogService = inject(TaskLogService);
  userService = inject(UserService);
  alertService = inject(AlertService);
  fb = inject(FormBuilder);

  ngOnInit(): void {
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dossierId'] || changes['selectedDossier'] || changes['dossier']) {
      this.currentPage = 1;
      this.loadTasks();
    }
  }

  get activeDossierId(): string | number {
    return this.dossierId || this.selectedDossier?.id || this.dossier?.id || '';
  }

  loadData(): void {
    this.userService.getAll().subscribe({
      next: (data) => {
        this.users = data.content || (Array.isArray(data) ? data : []);
      },
      error: () => {}
    });

    this.categoryService.getAll().subscribe({
      next: (data) => {
        this.categories = data.content || (Array.isArray(data) ? data : []);
        this.statusService.getAll().subscribe({
          next: (sData) => {
            const rawStatuses = sData.content || (Array.isArray(sData) ? sData : []);
            this.statuses = rawStatuses.sort((a: TaskStatus, b: TaskStatus) => (a.ordre_affichage || 0) - (b.ordre_affichage || 0));
            if (this.activeDossierId) {
              this.loadTasks();
            }
          },
          error: () => {
            if (this.activeDossierId) {
              this.loadTasks();
            }
          }
        });
      },
      error: () => {
        if (this.activeDossierId) {
          this.loadTasks();
        }
      }
    });
  }

  loadTasks(): void {
    const id = this.activeDossierId;
    if (!id) return;

    this.isLoading = true;
    this.taskService.getByDossierId(id, 0, 1000).subscribe({
      next: (data) => {
        const rawTasks = data.content || (Array.isArray(data) ? data : []);
        this.tasks = rawTasks.map((t: Task) => {
          if (t.categoryId && !t.category && this.categories.length > 0) {
            t.category = this.categories.find(c => String(c.id) === String(t.categoryId));
          }
          if (t.statusId && !t.status && this.statuses.length > 0) {
            t.status = this.statuses.find(s => String(s.id) === String(t.statusId));
          }
          return t;
        });
        this.tasks.forEach(task => {
          if (task.id) this.loadTaskLogs(Number(task.id));
        });
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching tasks:', err);
        this.isLoading = false;
      }
    });
  }

  loadTaskLogs(taskId: number): void {
    this.taskLogService.getAll().subscribe({
      next: (data) => {
        const rawLogs = data.content || (Array.isArray(data) ? data : []);
        this.taskLogsMap[taskId] = rawLogs
          .filter((l: TaskLog) => String(l.taskId) === String(taskId))
          .sort((a: TaskLog, b: TaskLog) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      error: () => {}
    });
  }

  get completionRate(): number {
    if (!this.tasks || this.tasks.length === 0) return 0;
    const closingStatuses = this.statuses.filter(s => s.isClosingStatus).map(s => String(s.id));
    const completedTasks = this.tasks.filter(t => t.isCompleted || (t.status && closingStatuses.includes(String(t.status.id)))).length;
    return Math.round((completedTasks / this.tasks.length) * 100);
  }

  get completedCount(): number {
    if (!this.tasks || this.tasks.length === 0) return 0;
    const closingStatuses = this.statuses.filter(s => s.isClosingStatus).map(s => String(s.id));
    return this.tasks.filter(t => t.isCompleted || (t.status && closingStatuses.includes(String(t.status.id)))).length;
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.filteredTasks = (this.tasks || []).filter(task => {
      const matchSearch = this.searchTerm
        ? ((task.titre || '').toLowerCase().includes(this.searchTerm.toLowerCase()) || (task.description || '').toLowerCase().includes(this.searchTerm.toLowerCase()))
        : true;
      const matchCategory = this.selectedCategoryId ? String(task.category?.id || task.categoryId) === String(this.selectedCategoryId) : true;
      const matchStatus = this.selectedStatusId ? String(task.status?.id || task.statusId) === String(this.selectedStatusId) : true;
      const matchUrgent = this.showUrgentOnly ? task.priorite === 'URGENTE' : true;
      return matchSearch && matchCategory && matchStatus && matchUrgent;
    });
  }

  toggleUrgentFilter(): void {
    this.showUrgentOnly = !this.showUrgentOnly;
    this.applyFilters();
  }

  openForm(task?: Task, isViewOnly: boolean = false): void {
    this.selectedTaskId = task?.id;
    this.taskToEdit = task;
    this.isEditing = !!task;
    this.isViewOnlyMode = isViewOnly;
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.isViewOnlyMode = false;
    this.selectedTaskId = undefined;
    this.taskToEdit = undefined;
  }

  saveTask(formVals: any): void {
    const assignedUsers = this.users.filter(u =>
      (formVals.assigneAIds || []).includes(String(u.id))
    );

    const category = this.categories.find(c => String(c.id) === String(formVals.categoryId));
    const status = this.statuses.find(s => String(s.id) === String(formVals.statusId));

    const { assigneAIds, categoryId, statusId, ...restFormVals } = formVals;

    const taskData: Task = {
      ...restFormVals,
      category: category!,
      status: status!,
      assignees: assignedUsers,
      dossierId: Number(this.activeDossierId),
      isCompleted: status?.isClosingStatus || false,
      createdAt: this.isEditing ? this.tasks.find(t => t.id === this.selectedTaskId)?.createdAt || new Date() : new Date()
    };

    if (this.isEditing && this.selectedTaskId) {
      taskData.id = Number(this.selectedTaskId);
      this.taskService.update(taskData).subscribe({
        next: () => {
          this.alertService.success('Tâche mise à jour avec succès');
          this.loadTasks();
          this.closeForm();
        },
        error: () => {
          this.alertService.displayMessage('Erreur', 'Impossible de mettre à jour la tâche', 'error');
        }
      });
    } else {
      this.taskService.create(taskData).subscribe({
        next: () => {
          this.alertService.success('Tâche créée avec succès');
          this.loadTasks();
          this.closeForm();
        },
        error: () => {
          this.alertService.displayMessage('Erreur', 'Impossible de créer la tâche', 'error');
        }
      });
    }
  }

  async deleteTask(taskId: number | string): Promise<void> {
    const confirmed = await this.alertService.confirmMessage(
      'Suppression de la tâche',
      'Voulez-vous vraiment supprimer définitivement cette tâche ?',
      'warning'
    );

    if (confirmed && taskId) {
      this.taskService.delete(String(taskId)).subscribe({
        next: () => {
          this.alertService.success('Tâche supprimée avec succès');
          this.loadTasks();
        },
        error: () => {
          this.alertService.displayMessage('Erreur', 'Impossible de supprimer la tâche', 'error');
        }
      });
    }
  }

  onStatusChange(task: Task, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newStatusId = target.value;
    const newStatus = this.statuses.find(s => String(s.id) === String(newStatusId));
    if (!newStatus) return;

    const updatedTask: Task = { 
      ...task, 
      status: newStatus,
      isCompleted: newStatus.isClosingStatus || false
    };
    this.taskService.update(updatedTask).subscribe({
      next: () => {
        this.loadTasks();
      }
    });
  }

  getPriorityBadgeClass(priorite?: string): string {
    switch (priorite) {
      case 'URGENTE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HAUTE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'NORMALE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'BASSE':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  }

  getCategory(id: string | number): TaskCategory | undefined {
    return this.categories.find(c => String(c.id) === String(id));
  }

  getStatus(id: string | number): TaskStatus | undefined {
    return this.statuses.find(s => String(s.id) === String(id));
  }

  getTaskLogs(taskId?: any): TaskLog[] {
    if (taskId === undefined || taskId === null) return [];
    return this.taskLogsMap[Number(taskId)] || [];
  }

  isOverdue(task: Task): boolean {
    if (!task || this.isClosed(task) || !task.dateEcheance) return false;
    const dueDate = new Date(task.dateEcheance);
    if (isNaN(dueDate.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  }

  isClosed(task: Task): boolean {
    return !!task?.status?.isClosingStatus || !!task?.isCompleted;
  }

  formatMinutesToHours(minutes: number): string {
    if (!minutes) return '0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm' : ''}`.trim() || '0m';
  }

  addQuickComment(task: Task, comment: string): void {
    if (!comment || !comment.trim() || !task.id) return;

    const newLog: TaskLog = {
      taskId: String(task.id),
      action: 'COMMENT',
      description: comment.trim(),
      createdAt: new Date(),
    };

    this.taskLogService.create(newLog).subscribe({
      next: () => {
        this.loadTaskLogs(Number(task.id));
      }
    });
  }

  switchTaskTab(taskId: any, tab: 'INFO' | 'LOGS'): void {
    if (!taskId) return;
    this.taskTabs[Number(taskId)] = tab;
  }

  getTaskTab(taskId?: any): 'INFO' | 'LOGS' {
    if (!taskId) return 'INFO';
    return this.taskTabs[Number(taskId)] || 'INFO';
  }

  getUserInitials(user: User): string {
    if (!user) return '?';
    const first = user.firstName ? user.firstName.charAt(0) : '';
    const last = user.lastName ? user.lastName.charAt(0) : '';
    return (first + last).toUpperCase() || (user.username ? user.username.substring(0, 2).toUpperCase() : '?');
  }

  trackByTaskId(index: number, task: Task): any {
    return task.id || index;
  }

  // Pagination Helpers
  get paginatedTasks(): Task[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredTasks.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTasks.length / this.pageSize));
  }

  get currentEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredTasks.length);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
