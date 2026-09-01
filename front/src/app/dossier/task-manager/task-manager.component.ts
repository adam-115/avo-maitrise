import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Task, TaskCategory, TaskStatus, User, TaskLog } from '../../appTypes';
import { TaskService } from '../../services/task.service';
import { TaskCategoryService } from '../../services/task-category.service';
import { TaskStatusService } from '../../services/task-status.service';
import { TaskLogService } from '../../services/task-log.service';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { UserService } from '../../services/user.service';
import { TaskDialogComponent } from './task-dialog/task-dialog.component';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';

@Component({
    selector: 'app-task-manager',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, TaskDialogComponent, TranslatePipe, TranslateDirective],
    templateUrl: './task-manager.component.html',
    styleUrls: ['./task-manager.component.css']
})
export class TaskManagerComponent implements OnInit, OnChanges {
    @Input() dossierId!: string | number;

    tasks: Task[] = [];
    filteredTasks: Task[] = [];
    categories: TaskCategory[] = [];
    statuses: TaskStatus[] = [];
    users: User[] = [];
    taskLogsMap: { [key: number]: TaskLog[] } = {};
    taskTabs: { [key: number]: 'INFO' | 'LOGS' } = {};

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
    fb = inject(FormBuilder);

    ngOnInit() {
        this.loadData();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['dossierId'] && !changes['dossierId'].firstChange) {
            this.currentPage = 1;
            this.loadTasks();
        }
    }

    loadData() {
        this.userService.getAll().subscribe(data => {
            this.users = data.content;
        });

        this.categoryService.getAll().subscribe(data => {
            this.categories = data.content;
            this.statusService.getAll().subscribe(sData => {
                this.statuses = sData.content.sort((a, b) => a.ordre_affichage - b.ordre_affichage);
                if (this.dossierId) {
                    this.loadTasks();
                }
            });
        });
    }

    loadTasks() {
        if (!this.dossierId) return;
        this.taskService.getByDossierId(this.dossierId, 0, 1000).subscribe(data => {
            this.tasks = data.content;
            this.tasks.forEach(task => {
                if (task.id) this.loadTaskLogs(Number(task.id));
            });
            this.applyFilters();
        });
    }

    loadTaskLogs(taskId: number) {
        this.taskLogService.getAll().subscribe(data => {
            this.taskLogsMap[taskId] = data.content
                .filter(l => String(l.taskId) === String(taskId))
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        });
    }

    get completionRate(): number {
        if (this.tasks.length === 0) return 0;
        const closingStatuses = this.statuses.filter(s => s.isClosingStatus).map(s => String(s.id));
        const completedTasks = this.tasks.filter(t => closingStatuses.includes(String(t.status?.id))).length;
        return Math.round((completedTasks / this.tasks.length) * 100);
    }

    get completedCount(): number {
        const closingStatuses = this.statuses.filter(s => s.isClosingStatus).map(s => String(s.id));
        return this.tasks.filter(t => closingStatuses.includes(String(t.status?.id))).length;
    }

    applyFilters() {
        this.currentPage = 1;
        this.filteredTasks = this.tasks.filter(task => {
            const matchSearch = this.searchTerm ? task.titre.toLowerCase().includes(this.searchTerm.toLowerCase()) : true;
            const matchCategory = this.selectedCategoryId ? String(task.category?.id) === String(this.selectedCategoryId) : true;
            const matchStatus = this.selectedStatusId ? String(task.status?.id) === String(this.selectedStatusId) : true;
            const matchUrgent = this.showUrgentOnly ? task.priorite === 'URGENTE' : true;
            return matchSearch && matchCategory && matchStatus && matchUrgent;
        });
    }

    toggleUrgentFilter() {
        this.showUrgentOnly = !this.showUrgentOnly;
        this.applyFilters();
    }

    openForm(task?: Task, isViewOnly: boolean = false) {
        this.selectedTaskId = task?.id;
        this.taskToEdit = task;
        this.isEditing = !!task;
        this.isViewOnlyMode = isViewOnly;
        this.showForm = true;
    }

    closeForm() {
        this.showForm = false;
        this.isEditing = false;
        this.isViewOnlyMode = false;
        this.selectedTaskId = undefined;
        this.taskToEdit = undefined;
    }

    saveTask(formVals: any) {
        // Map assigned IDs back to User objects
        const assignedUsers = this.users.filter(u =>
            (formVals.assigneAIds || []).includes(String(u.id))
        );

        // Find Category and Status objects
        const category = this.categories.find(c => String(c.id) === String(formVals.categoryId));
        const status = this.statuses.find(s => String(s.id) === String(formVals.statusId));

        // Omit IDs from the final object
        const { assigneAIds, categoryId, statusId, ...restFormVals } = formVals;

        const taskData: Task = {
            ...restFormVals,
            category: category!,
            status: status!,
            assignees: assignedUsers,
            dossierId: Number(this.dossierId),
            isCompleted: status?.isClosingStatus || false,
            createdAt: this.isEditing ? this.tasks.find(t => t.id === this.selectedTaskId)?.createdAt || new Date() : new Date()
        };

        if (this.isEditing && this.selectedTaskId) {
            taskData.id = Number(this.selectedTaskId);
            this.taskService.update(taskData).subscribe(() => {
                this.loadTasks();
                this.closeForm();
            });
        } else {
            this.taskService.create(taskData).subscribe(() => {
                this.loadTasks();
                this.closeForm();
            });
        }
    }

    onStatusChange(task: Task, event: Event) {
        const target = event.target as HTMLSelectElement;
        const newStatusId = target.value;
        const newStatus = this.statuses.find(s => String(s.id) === String(newStatusId));
        if (!newStatus) return;

        const updatedTask: Task = { 
            ...task, 
            status: newStatus,
            isCompleted: newStatus.isClosingStatus
        };
        this.taskService.update(updatedTask).subscribe(() => {
            this.loadTasks();
        });
    }

    getCategory(id: string | number): TaskCategory | undefined {
        return this.categories.find(c => String(c.id) === String(id));
    }

    getStatus(id: string | number): TaskStatus | undefined {
        return this.statuses.find(s => String(s.id) === String(id));
    }

    getTaskLogs(taskId?: number): TaskLog[] {
        if (taskId === undefined) return [];
        return this.taskLogsMap[taskId] || [];
    }

    isOverdue(task: Task): boolean {
        if (this.isClosed(task)) return false;
        const dueDate = new Date(task.dateEcheance);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate < today;
    }

    isClosed(task: Task): boolean {
        return task.status?.isClosingStatus || false;
    }

    formatMinutesToHours(minutes: number): string {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m > 0 ? m + 'm' : ''}`.trim();
    }

    addQuickComment(task: Task, comment: string) {
        if (!comment.trim() || !task.id) return;

        const newLog: TaskLog = {
            taskId: String(task.id),
            action: 'COMMENT',
            description: comment.trim(),
            createdAt: new Date(),
        };

        this.taskLogService.create(newLog).subscribe(() => {
            this.loadTaskLogs(Number(task.id));
        });
    }

    switchTaskTab(taskId: number, tab: 'INFO' | 'LOGS') {
        this.taskTabs[taskId] = tab;
    }

    getTaskTab(taskId: number): 'INFO' | 'LOGS' {
        return this.taskTabs[taskId] || 'INFO';
    }

    // Pagination Helpers
    get paginatedTasks(): Task[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.filteredTasks.slice(start, start + this.pageSize);
    }

    get totalPages(): number {
        return Math.ceil(this.filteredTasks.length / this.pageSize);
    }

    get currentEndIndex(): number {
        return Math.min(this.currentPage * this.pageSize, this.filteredTasks.length);
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
        }
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }
}
