import { CommonModule, formatDate } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatterEvent, User } from '../../appTypes';
import { UserService } from '../../services/user.service';
import { UserSelectionDialog } from '../../dossier/user-selection-dialog/user-selection-dialog';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { EventTypeService } from '../../services/event-type.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-evenement-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, UserSelectionDialog, TranslatePipe],
  templateUrl: './evenement-dialog.component.html',
  styleUrl: './evenement-dialog.component.css'
})
export class EvenementDialogComponent implements OnInit, OnChanges {

  @Input({ required: true }) dossierId!: string;
  @Input() eventToEdit: MatterEvent | null = null;

  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() eventCreated = new EventEmitter<MatterEvent>();
  @Output() eventUpdated = new EventEmitter<MatterEvent>();

  private userService = inject(UserService);
  private eventTypeService = inject(EventTypeService);

  eventForm!: FormGroup;
  users: User[] = [];
  eventTypes: any[] = [];
  showUserDialog = false;
  isSubmitting = false;

  ngOnInit(): void {
    this.initForm();
    this.loadUsersAndTypes();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.eventForm) {
      this.initForm();
    }
    if (changes['eventToEdit'] && this.eventForm) {
      this.populateForm();
    }
  }

  private initForm(): void {
    this.eventForm = new FormGroup({
      titre: new FormControl('', [Validators.required, Validators.minLength(2)]),
      typeId: new FormControl('', [Validators.required]),
      startDate: new FormControl('', [Validators.required]),
      startTime: new FormControl('09:00'),
      endDate: new FormControl(''),
      endTime: new FormControl(''),
      isAllDay: new FormControl(false),
      participantsIds: new FormControl([]),
      lieu: new FormControl(''),
      description: new FormControl(''),
      reminder: new FormControl(false),
      reminderMinutesBefore: new FormControl(30)
    });

    if (this.eventToEdit) {
      this.populateForm();
    }
  }

  private loadUsersAndTypes(): void {
    this.userService.getAll().subscribe({
      next: (data: PaginatedResponse<User>) => {
        this.users = data.content || [];
      },
      error: () => {}
    });

    this.eventTypeService.getAll().subscribe({
      next: (data: PaginatedResponse<any>) => {
        this.eventTypes = data.content || [];
      },
      error: () => {}
    });
  }

  private populateForm(): void {
    if (!this.eventToEdit) {
      this.eventForm.reset({
        isAllDay: false,
        reminder: false,
        reminderMinutesBefore: 30,
        participantsIds: []
      });
      return;
    }

    let startTime = '';
    if (!this.eventToEdit.isAllDay && this.eventToEdit.startDate) {
      const dateObj = new Date(this.eventToEdit.startDate);
      startTime = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
    }

    let endTime = '';
    if (!this.eventToEdit.isAllDay && this.eventToEdit.endDate) {
      const dateObj = new Date(this.eventToEdit.endDate);
      endTime = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
    }

    this.eventForm.patchValue({
      titre: this.eventToEdit.titre,
      typeId: this.eventToEdit.categorie ? this.eventToEdit.categorie.id : '',
      startDate: this.eventToEdit.startDate ? formatDate(this.eventToEdit.startDate, 'yyyy-MM-dd', 'en-US') : '',
      startTime: startTime || '09:00',
      endDate: this.eventToEdit.endDate ? formatDate(this.eventToEdit.endDate, 'yyyy-MM-dd', 'en-US') : '',
      endTime: endTime,
      isAllDay: !!this.eventToEdit.isAllDay,
      participantsIds: this.eventToEdit.participantsIds || [],
      lieu: this.eventToEdit.lieu || '',
      description: this.eventToEdit.description || '',
      reminder: !!this.eventToEdit.reminderMinutesBefore,
      reminderMinutesBefore: this.eventToEdit.reminderMinutesBefore || 30
    });
  }

  onCloseModal(): void {
    this.closeModalEvent.emit();
  }

  openUserDialog(): void {
    this.showUserDialog = true;
  }

  closeUserDialog(): void {
    this.showUserDialog = false;
  }

  onUsersSelected(selectedIds: string[]): void {
    this.eventForm.patchValue({ participantsIds: selectedIds });
    this.closeUserDialog();
  }

  getSelectedIntervenants(): User[] {
    const selectedIds = (this.eventForm.get('participantsIds')?.value || []).map((id: any) => String(id));
    return this.users.filter(user => selectedIds.includes(String(user.id)));
  }

  getUserInitials(user: User): string {
    if (!user || !user.username) return '?';
    return user.username.substring(0, 2).toUpperCase();
  }

  removeIntervenant(userId: string | number): void {
    const currentIds = this.eventForm.get('participantsIds')?.value || [];
    const newIds = currentIds.filter((id: string | number) => String(id) !== String(userId));
    this.eventForm.patchValue({ participantsIds: newIds });
  }

  submitForm(): void {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.eventForm.value;

    let startDateTime = new Date(formValue.startDate);
    if (!formValue.isAllDay && formValue.startTime) {
      const [hours, minutes] = formValue.startTime.split(':');
      startDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
    }

    let endDateTime = formValue.endDate ? new Date(formValue.endDate) : new Date(startDateTime);
    if (!formValue.isAllDay && formValue.endTime) {
      const [hours, minutes] = formValue.endTime.split(':');
      endDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
    }

    const eventData: MatterEvent = {
      dossierId: this.dossierId,
      titre: formValue.titre,
      categorie: this.eventTypes.find(et => String(et.id) === String(formValue.typeId)),
      startDate: startDateTime,
      endDate: endDateTime,
      isAllDay: formValue.isAllDay,
      lieu: formValue.lieu,
      description: formValue.description,
      participantsIds: formValue.participantsIds || [],
      reminderMinutesBefore: formValue.reminder ? formValue.reminderMinutesBefore : undefined,
      statut: this.eventToEdit ? this.eventToEdit.statut : 'CONFIRME',
      createdAt: this.eventToEdit ? this.eventToEdit.createdAt : new Date(),
      updatedAt: new Date()
    };

    if (this.eventToEdit && this.eventToEdit.id) {
      eventData.id = this.eventToEdit.id;
      this.eventUpdated.emit(eventData);
    } else {
      this.eventCreated.emit(eventData);
    }

    this.isSubmitting = false;
  }
}
