import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { EventTypeService } from '../../services/event-type.service';
import { EventType } from '../../appTypes';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { AlertService } from '../../services/alert-service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-event-type',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslatePipe],
    templateUrl: './event-type.component.html',
    styleUrls: ['./event-type.component.css']
})
export class EventTypeComponent implements OnInit {
    eventTypes: EventType[] = [];
    eventForm: FormGroup;
    isEditing = false;
    selectedEventTypeId: string | number | null = null;
    errorMessage: string = '';

    private eventTypeService = inject(EventTypeService);
    private fb = inject(FormBuilder);
    private alertService = inject(AlertService);

    constructor() {
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
            next: (data: PaginatedResponse<EventType>) => {
                this.eventTypes = data.content.sort((a, b) => a.order - b.order);
            },
            error: (err) => {
                console.error('Error loading event types', err);
                this.errorMessage = 'Erreur lors du chargement des types d\'événements.';
                this.alertService.displayMessage('Erreur', this.errorMessage, 'error');
            }
        });
    }

    onSubmit(): void {
        if (this.eventForm.valid) {
            const formValue = this.eventForm.value;
            const eventTypeData: any = {
                ...formValue
            };

            if (this.isEditing && this.selectedEventTypeId) {
                eventTypeData.id = this.selectedEventTypeId;
                this.eventTypeService.update(eventTypeData).subscribe({
                    next: () => {
                        this.alertService.success('Type d\'événement mis à jour avec succès');
                        this.resetForm();
                        this.loadEventTypes();
                    },
                    error: (err) => {
                        console.error('Error updating event type', err);
                        this.alertService.displayMessage('Erreur', 'Erreur lors de la mise à jour.', 'error');
                    }
                });
            } else {
                this.eventTypeService.create(eventTypeData).subscribe({
                    next: () => {
                        this.alertService.success('Type d\'événement créé avec succès');
                        this.resetForm();
                        this.loadEventTypes();
                    },
                    error: (err) => {
                        console.error('Error creating event type', err);
                        this.alertService.displayMessage('Erreur', 'Erreur lors de la création.', 'error');
                    }
                });
            }
        }
    }

    editEventType(eventType: EventType): void {
        this.isEditing = true;
        this.selectedEventTypeId = eventType.id!;
        this.eventForm.patchValue({
            label: eventType.label,
            code: eventType.code,
            color: eventType.color,
            order: eventType.order,
            active: eventType.active
        });
    }

    async deleteEventType(id: string | number): Promise<void> {
        const eventType = this.eventTypes.find(e => String(e.id) === String(id));
        if (eventType) {
            const isConfirmed = await this.alertService.confirmMessage('Confirmation', 'Êtes-vous sûr de vouloir désactiver ce type d\'événement ?', 'warning');
            if (isConfirmed) {
                const updatedEventType: EventType = { ...eventType, active: false };
                this.eventTypeService.update(updatedEventType).subscribe({
                    next: () => {
                        this.alertService.success('Type d\'événement désactivé avec succès');
                        this.loadEventTypes();
                    },
                    error: (err) => {
                        console.error('Error deactivating event type', err);
                        this.alertService.displayMessage('Erreur', 'Erreur lors de la désactivation.', 'error');
                    }
                });
            }
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
}
