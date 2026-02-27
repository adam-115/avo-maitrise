import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Task, TaskCategory, TaskStatus, TaskLog, TaskTimeLog } from '../../appTypes';
import { TaskService } from '../../services/task.service';
import { TaskCategoryService } from '../../services/task-category.service';
import { TaskStatusService } from '../../services/task-status.service';
import { TaskLogService } from '../../services/task-log.service';
import { TaskTimeLogService } from '../../services/task-time-log.service';

@Component({
    selector: 'app-task-manager',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule],
    templateUrl: './task-manager.component.html',
    styleUrls: ['./task-manager.component.css']
})
export class TaskManagerComponent implements OnInit {
    @Input() dossierId!: string | number;

    tasks: Task[] = [];
    filteredTasks: Task[] = [];
    categories: TaskCategory[] = [];
    statuses: TaskStatus[] = [];

    taskForm!: FormGroup;
    showForm: boolean = false;
    isEditing: boolean = false;
    selectedTaskId: number | undefined = undefined;

    // Filters
    searchTerm: string = '';
    selectedCategoryId: string = '';
    selectedStatusId: string = '';
    showUrgentOnly: boolean = false;

    // Comments / Logs
    showCommentsForTaskId: number | undefined = undefined;
    activeTabForTaskId: 'COMMENTS' | 'TIME' = 'COMMENTS';
    currentTaskLogs: TaskLog[] = [];
    commentText: string = '';

    // Time Tracking
    currentTimeLogs: TaskTimeLog[] = [];
    timeSpentInput: number | null = null;
    timeCommentInput: string = '';

    taskService = inject(TaskService);
    categoryService = inject(TaskCategoryService);
    statusService = inject(TaskStatusService);
    taskLogService = inject(TaskLogService);
    taskTimeLogService = inject(TaskTimeLogService);
    fb = inject(FormBuilder);

    ngOnInit() {
        this.initForm();
        this.loadData();
    }

    initForm() {
        this.taskForm = this.fb.group({
            titre: ['', Validators.required],
            description: [''],
            categoryId: ['', Validators.required],
            statusId: ['', Validators.required],
            priorite: ['NORMALE', Validators.required],
            dateEcheance: [new Date().toISOString().split('T')[0], Validators.required]
        });
    }

    loadData() {
        this.categoryService.getAll().subscribe(cats => {
            this.categories = cats;
            this.statusService.getAll().subscribe(stats => {
                this.statuses = stats.sort((a, b) => a.ordre_affichage - b.ordre_affichage);
                if (this.dossierId) {
                    this.loadTasks();
                }
            });
        });
    }

    loadTasks() {
        this.taskService.getAll().subscribe(allTasks => {
            this.tasks = allTasks.filter(t => t.dossierId == this.dossierId);
            this.applyFilters();
        });
    }

    get completionRate(): number {
        if (this.tasks.length === 0) return 0;
        const closingStatuses = this.statuses.filter(s => s.isClosingStatus).map(s => String(s.id));
        const completedTasks = this.tasks.filter(t => closingStatuses.includes(String(t.statusId))).length;
        return Math.round((completedTasks / this.tasks.length) * 100);
    }

    get completedCount(): number {
        const closingStatuses = this.statuses.filter(s => s.isClosingStatus).map(s => String(s.id));
        return this.tasks.filter(t => closingStatuses.includes(String(t.statusId))).length;
    }

    applyFilters() {
        this.filteredTasks = this.tasks.filter(task => {
            const matchSearch = this.searchTerm ? task.titre.toLowerCase().includes(this.searchTerm.toLowerCase()) : true;
            const matchCategory = this.selectedCategoryId ? String(task.categoryId) === String(this.selectedCategoryId) : true;
            const matchStatus = this.selectedStatusId ? String(task.statusId) === String(this.selectedStatusId) : true;
            const matchUrgent = this.showUrgentOnly ? task.priorite === 'URGENTE' : true;
            return matchSearch && matchCategory && matchStatus && matchUrgent;
        });
    }

    toggleUrgentFilter() {
        this.showUrgentOnly = !this.showUrgentOnly;
        this.applyFilters();
    }

    openForm(task?: Task) {
        this.showForm = true;
        if (task) {
            this.isEditing = true;
            this.selectedTaskId = task.id;
            this.taskForm.patchValue({
                titre: task.titre,
                description: task.description,
                categoryId: task.categoryId,
                statusId: task.statusId,
                priorite: task.priorite,
                dateEcheance: new Date(task.dateEcheance).toISOString().split('T')[0]
            });
        } else {
            this.isEditing = false;
            this.selectedTaskId = undefined;
            const defaultStatus = this.statuses.length > 0 ? this.statuses[0].id : '';
            this.taskForm.reset({
                priorite: 'NORMALE',
                statusId: defaultStatus,
                dateEcheance: new Date().toISOString().split('T')[0]
            });
        }
    }

    closeForm() {
        this.showForm = false;
        this.taskForm.reset();
    }

    saveTask() {
        if (this.taskForm.invalid) return;
        const formVals = this.taskForm.value;
        const taskData: Task = {
            ...formVals,
            dossierId: this.dossierId,
            isCompleted: false,
            createdAt: this.isEditing ? this.tasks.find(t => t.id === this.selectedTaskId)?.createdAt || new Date() : new Date()
        };

        if (this.isEditing && this.selectedTaskId) {
            taskData.id = this.selectedTaskId;
            this.taskService.update(this.selectedTaskId.toString(), taskData).subscribe(() => {
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
        const updatedTask = { ...task, statusId: newStatusId };
        this.taskService.update((task.id as number).toString(), updatedTask).subscribe(() => {
            this.loadTasks();
        });
    }

    getCategory(id: string | number): TaskCategory | undefined {
        return this.categories.find(c => String(c.id) === String(id));
    }

    getStatus(id: string | number): TaskStatus | undefined {
        return this.statuses.find(s => String(s.id) === String(id));
    }

    isOverdue(task: Task): boolean {
        if (this.isClosed(task)) return false;
        const dueDate = new Date(task.dateEcheance);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate < today;
    }

    isClosed(task: Task): boolean {
        const status = this.getStatus(task.statusId);
        return status?.isClosingStatus || false;
    }

    toggleComments(taskId: number | undefined) {
        if (!taskId) return;
        if (this.showCommentsForTaskId === taskId) {
            this.showCommentsForTaskId = undefined;
            this.currentTaskLogs = [];
            this.currentTimeLogs = [];
        } else {
            this.showCommentsForTaskId = taskId;
            this.activeTabForTaskId = 'COMMENTS';
            this.loadLogsForTask(taskId);
            this.loadTimeLogsForTask(taskId);
        }
    }

    switchTab(tab: 'COMMENTS' | 'TIME') {
        this.activeTabForTaskId = tab;
    }

    loadLogsForTask(taskId: number) {
        this.taskLogService.getAll().subscribe(logs => {
            this.currentTaskLogs = logs.filter(l => String(l.taskId) === String(taskId)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        });
    }

    loadTimeLogsForTask(taskId: number) {
        this.taskTimeLogService.getAll().subscribe(logs => {
            this.currentTimeLogs = logs.filter(l => String(l.taskId) === String(taskId)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        });
    }

    addComment(taskId: number | undefined) {
        if (!taskId || !this.commentText.trim()) return;

        const newLog: TaskLog = {
            taskId: String(taskId),
            action: 'COMMENT',
            description: this.commentText.trim(),
            createdAt: new Date(),
        };

        this.taskLogService.create(newLog).subscribe(() => {
            this.commentText = '';
            this.loadLogsForTask(taskId);
        });
    }

    addTimeLog(taskId: number | undefined) {
        if (!taskId || !this.timeSpentInput) return;

        const newTimeLog: TaskTimeLog = {
            taskId: String(taskId),
            timeSpentMinutes: this.timeSpentInput,
            description: this.timeCommentInput.trim(),
            createdAt: new Date(),
        };

        this.taskTimeLogService.create(newTimeLog).subscribe(() => {
            this.timeSpentInput = null;
            this.timeCommentInput = '';
            this.loadTimeLogsForTask(taskId);
        });
    }

    getTotalTimeSpent(): number {
        return this.currentTimeLogs.reduce((acc, log) => acc + (log.timeSpentMinutes || 0), 0);
    }

    formatMinutesToHours(minutes: number): string {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m > 0 ? m + 'm' : ''}`.trim();
    }
}
