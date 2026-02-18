import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../appTypes';

@Component({
    selector: 'app-user-selection-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './user-selection-dialog.html',
    styleUrl: './user-selection-dialog.css'
})
export class UserSelectionDialog implements OnInit {
    @Input() users: User[] = [];
    @Input() initialSelection: string[] = []; // List of User IDs
    @Input() singleSelection: boolean = false;
    @Output() confirmSelection = new EventEmitter<string[]>();
    @Output() closeDialog = new EventEmitter<void>();

    filteredUsers: User[] = [];
    selectedUserIds: Set<string> = new Set();
    searchTerm: string = '';

    ngOnInit(): void {
        this.filteredUsers = [...this.users];
        // Convert IDs to string if they are numbers, to ensure Set works correctly
        this.initialSelection.forEach(id => this.selectedUserIds.add(String(id)));
    }

    filterUsers(): void {
        if (!this.searchTerm) {
            this.filteredUsers = [...this.users];
        } else {
            const lowerTerm = this.searchTerm.toLowerCase();
            this.filteredUsers = this.users.filter(user =>
                user.name.toLowerCase().includes(lowerTerm) ||
                user.email.toLowerCase().includes(lowerTerm)
            );
        }
    }

    toggleSelection(userId: number): void {
        const idStr = String(userId);
        if (this.singleSelection) {
            this.selectedUserIds.clear();
            this.selectedUserIds.add(idStr);
        } else {
            if (this.selectedUserIds.has(idStr)) {
                this.selectedUserIds.delete(idStr);
            } else {
                this.selectedUserIds.add(idStr);
            }
        }
    }

    isSelected(userId: number): boolean {
        return this.selectedUserIds.has(String(userId));
    }

    onConfirm(): void {
        this.confirmSelection.emit(Array.from(this.selectedUserIds));
    }

    onCancel(): void {
        this.closeDialog.emit();
    }
}
