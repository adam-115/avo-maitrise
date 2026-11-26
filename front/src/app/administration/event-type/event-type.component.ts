import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { EventTypeService } from '../../services/event-type.service';
import { EventType } from '../../appTypes';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { AlertService } from '../../services/alert-service';
import { NavigationService } from '../../services/navigation-service';
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

  searchTerm: string = '';
  filterStatus: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';

  presetColors: string[] = [
    '#3b82f6', '#2563eb', '#1d4ed8', '#0ea5e9', 
    '#06b6d4', '#14b8a6', '#10b981', '#8b5cf6', 
    '#a855f7', '#f59e0b', '#f97316', '#ef4444'
  ];

  private eventTypeService = inject(EventTypeService);
  private navigationService = inject(NavigationService);
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);

  constructor() {
    this.eventForm = this.fb.group({
      label: ['', [Validators.required, Validators.minLength(2)]],
      code: ['', [Validators.required, Validators.minLength(2)]],
      color: ['#3b82f6', Validators.required],
      order: [1, [Validators.required, Validators.min(0)]],
      active: [true]
    });
  }

  ngOnInit(): void {
    this.loadEventTypes();
  }

  navigateBackToPreferences(): void {
    this.navigationService.navigateToAdminPrefences();
  }

  loadEventTypes(): void {
    this.eventTypeService.getAll().subscribe({
      next: (data: PaginatedResponse<EventType>) => {
        const raw = data.content || (Array.isArray(data) ? data : []);
        this.eventTypes = raw.sort((a, b) => (a.order || 0) - (b.order || 0));
      },
      error: (err) => {
        console.error('Error loading event types', err);
        this.errorMessage = 'Erreur lors du chargement des types d\'événements.';
        this.alertService.displayMessage('Erreur', this.errorMessage, 'error');
      }
    });
  }

  get totalCount(): number {
    return this.eventTypes?.length || 0;
  }

  get activeCount(): number {
    return (this.eventTypes || []).filter(e => e.active).length;
  }

  get inactiveCount(): number {
    return (this.eventTypes || []).filter(e => !e.active).length;
  }

  get filteredEventTypes(): EventType[] {
    return (this.eventTypes || []).filter(e => {
      const matchSearch = this.searchTerm
        ? ((e.label || '').toLowerCase().includes(this.searchTerm.toLowerCase()) || (e.code || '').toLowerCase().includes(this.searchTerm.toLowerCase()))
        : true;
      const matchStatus = this.filterStatus === 'ALL'
        ? true
        : this.filterStatus === 'ACTIVE'
          ? !!e.active
          : !e.active;
      return matchSearch && matchStatus;
    });
  }

  setColor(color: string): void {
    this.eventForm.patchValue({ color: color });
  }

  onSubmit(): void {
    if (this.eventForm.valid) {
      const formValue = this.eventForm.value;
      const eventTypeData: any = {
        ...formValue,
        code: (formValue.code || '').toUpperCase().trim(),
        order: Number(formValue.order) || 0
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
    } else {
      this.eventForm.markAllAsTouched();
    }
  }

  editEventType(eventType: EventType): void {
    this.isEditing = true;
    this.selectedEventTypeId = eventType.id!;
    this.eventForm.patchValue({
      label: eventType.label,
      code: eventType.code,
      color: eventType.color || '#3b82f6',
      order: eventType.order || 0,
      active: eventType.active
    });

    const formCard = document.getElementById('eventTypeFormCard');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async toggleEventTypeActive(eventType: EventType): Promise<void> {
    if (!eventType.id) return;
    const newStatus = !eventType.active;
    const title = newStatus ? 'Réactivation' : 'Désactivation';
    const message = newStatus
      ? 'Voulez-vous réactiver ce type d\'événement ?'
      : 'Êtes-vous sûr de vouloir désactiver ce type d\'événement ?';

    const isConfirmed = await this.alertService.confirmMessage(title, message, 'warning');
    if (isConfirmed) {
      const updatedEventType: EventType = { ...eventType, active: newStatus };
      this.eventTypeService.update(updatedEventType).subscribe({
        next: () => {
          this.alertService.success(newStatus ? 'Type d\'événement réactivé avec succès' : 'Type d\'événement désactivé avec succès');
          this.loadEventTypes();
        },
        error: (err) => {
          console.error('Error toggling event type active', err);
          this.alertService.displayMessage('Erreur', 'Impossible de modifier le statut.', 'error');
        }
      });
    }
  }

  async deleteEventType(id: string | number): Promise<void> {
    const eventType = this.eventTypes.find(e => String(e.id) === String(id));
    if (eventType) {
      await this.toggleEventTypeActive(eventType);
    }
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.isEditing = false;
    this.selectedEventTypeId = null;
    const nextOrder = (this.eventTypes.length > 0 ? Math.max(...this.eventTypes.map(e => e.order || 0)) + 1 : 1);
    this.eventForm.reset({
      active: true,
      color: '#3b82f6',
      order: nextOrder
    });
  }
}
