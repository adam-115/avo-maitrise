import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Task, TaskCategory, TaskStatus, User } from '../../appTypes';
import { TaskService } from '../../services/task.service';
import { TaskCategoryService } from '../../services/task-category.service';
import { TaskStatusService } from '../../services/task-status.service';
import { UserService } from '../../services/user.service';
import { TaskDialogComponent } from './task-dialog/task-dialog.component';

@Component({
    selector: 'app-task-manager',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, TaskDialogComponent],
    templateUrl: './task-manager.component.html',
    styleUrls: ['./task-manager.component.css']
})
export class TaskManagerComponent implements OnInit {
    @Input() dossierId!: string | number;

    tasks: Task[] = [];
    filteredTasks: Task[] = [];
    categories: TaskCategory[] = [];
    statuses: TaskStatus[] = [];
    users: User[] = [];

    showForm: boolean = false;
    isEditing: boolean = false;
    isViewOnlyMode: boolean = false;
    selectedTaskId: number | undefined = undefined;
    taskToEdit?: Task;

    // Filters
    searchTerm: string = '';
    selectedCategoryId: string = '';
    selectedStatusId: string = '';
    showUrgentOnly: boolean = false;

    taskService = inject(TaskService);
    categoryService = inject(TaskCategoryService);
    statusService = inject(TaskStatusService);
    userService = inject(UserService);
    fb = inject(FormBuilder);

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.userService.getAll().subscribe(usersList => {
            this.users = usersList;
        });

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

        // Omit assigneAIds from the final object
        const { assigneAIds, ...restFormVals } = formVals;

        const taskData: Task = {
            ...restFormVals,
            assigneA: assignedUsers,
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

    formatMinutesToHours(minutes: number): string {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m > 0 ? m + 'm' : ''}`.trim();
    }
}
