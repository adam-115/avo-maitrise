import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { EventTypeService } from '../../services/event-type.service';
import { EventType } from '../../appTypes';

@Component({
    selector: 'app-event-type',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule],
    templateUrl: './event-type.component.html',
    styleUrls: ['./event-type.component.css']
})
export class EventTypeComponent implements OnInit {
    eventTypes: EventType[] = [];
    eventForm: FormGroup;
    isEditing = false;
    selectedEventTypeId: string | number | null = null;
    errorMessage: string = '';

    constructor(
        private eventTypeService: EventTypeService,
        private fb: FormBuilder
    ) {
        this.eventForm = this.fb.group({
            label: ['', Validators.required],
            code: ['', Validators.required],
            color: ['#000000'],
            order: [0, Validators.required],
            active: [true]
        });
    }

    ngOnInit(): void {
        this.loadEventTypes();
    }

    loadEventTypes(): void {
        this.eventTypeService.getAll().subscribe({
            next: (data) => {
                this.eventTypes = data.sort((a, b) => a.order - b.order);
            },
            error: (err) => {
                console.error('Error loading event types', err);
                this.errorMessage = 'Erreur lors du chargement des types d\'événements.';
            }
        });
    }

    onSubmit(): void {
        if (this.eventForm.valid) {
            const formValue = this.eventForm.value;
            const eventTypeData: EventType = {
                ...formValue,
                id: this.selectedEventTypeId ? this.selectedEventTypeId : this.generateId()
            };

            if (this.isEditing && this.selectedEventTypeId) {
                this.eventTypeService.update(this.selectedEventTypeId.toString(), eventTypeData).subscribe({
                    next: () => {
                        this.resetForm();
                        this.loadEventTypes();
                    },
                    error: (err) => {
                        console.error('Error updating event type', err);
                        this.errorMessage = 'Erreur lors de la mise à jour.';
                    }
                });
            } else {
                this.eventTypeService.create(eventTypeData).subscribe({
                    next: () => {
                        this.resetForm();
                        this.loadEventTypes();
                    },
                    error: (err) => {
                        console.error('Error creating event type', err);
                        this.errorMessage = 'Erreur lors de la création.';
                    }
                });
            }
        }
    }

    editEventType(eventType: EventType): void {
        this.isEditing = true;
        this.selectedEventTypeId = eventType.id;
        this.eventForm.patchValue({
            label: eventType.label,
            code: eventType.code,
            color: eventType.color,
            order: eventType.order,
            active: eventType.active
        });
    }

    deleteEventType(id: string | number): void {
        const eventType = this.eventTypes.find(e => String(e.id) === String(id));
        if (eventType && confirm('Êtes-vous sûr de vouloir désactiver ce type d\'événement ?')) {
            const updatedEventType: EventType = { ...eventType, active: false };
            this.eventTypeService.update(id.toString(), updatedEventType).subscribe({
                next: () => this.loadEventTypes(),
                error: (err) => console.error('Error deactivating event type', err)
            });
        }
    }

    cancelEdit(): void {
        this.resetForm();
    }

    resetForm(): void {
        this.isEditing = false;
        this.selectedEventTypeId = null;
        this.eventForm.reset({
            active: true,
            color: '#000000',
            order: 0
        });
    }

    generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}
