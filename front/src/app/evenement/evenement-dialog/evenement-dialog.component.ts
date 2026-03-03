import { CommonModule, formatDate } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatterEvent, User } from '../../appTypes';
import { UserService } from '../../services/user.service';
import { UserSelectionDialog } from '../../dossier/user-selection-dialog/user-selection-dialog';

@Component({
  selector: 'app-evenement-dialog',
  imports: [ReactiveFormsModule, CommonModule, UserSelectionDialog],
  templateUrl: './evenement-dialog.component.html',
  styleUrl: './evenement-dialog.component.css'
})
export class EvenementDialogComponent implements OnInit {

  @Input({ required: true })
  dossierId!: string;

  @Input()
  eventToEdit: MatterEvent | null = null;

  @Output()
  closeModalEvent = new EventEmitter<void>();

  @Output()
  eventCreated = new EventEmitter<MatterEvent>();

  @Output()
  eventUpdated = new EventEmitter<MatterEvent>();

  eventForm!: FormGroup;
  users: User[] = [];
  showUserDialog = false;

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.userService.getAll().subscribe(data => this.users = data);

    this.eventForm = new FormGroup({
      titre: new FormControl('', [Validators.required, Validators.minLength(3)]),
      typeId: new FormControl('', [Validators.required]),
      startDate: new FormControl('', [Validators.required]),
      startTime: new FormControl(''),
      organisateurId: new FormControl(''),
      participantsIds: new FormControl([]),
      lieu: new FormControl(''),
      reminder: new FormControl(false)
    });

    if (this.eventToEdit) {
      this.ngOnChanges()
    }
  }

  ngOnChanges(): void {

    if (this.eventToEdit) {
      let startTime = '';
      if (!this.eventToEdit.isAllDay && this.eventToEdit.startDate) {
        const dateObj = new Date(this.eventToEdit.startDate);
        startTime = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
      }

      this.eventForm.patchValue({
        titre: this.eventToEdit.titre,
        typeId: this.eventToEdit.typeId,
        startDate: formatDate(this.eventToEdit.startDate, 'yyyy-MM-dd', 'en-US'),
        startTime: startTime,
        organisateurId: this.eventToEdit.organisateurId,
        participantsIds: this.eventToEdit.participantsIds || [],
        lieu: this.eventToEdit.lieu,
        reminder: !!this.eventToEdit.reminderMinutesBefore
      });
    } else {
      this.eventForm.reset();
    }
  }

  onCloseModal() {
    this.closeModalEvent.emit();
  }

  // Fonctions de gestion du UserSelectionDialog
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
    const selectedIds = this.eventForm.get('participantsIds')?.value || [];
    return this.users.filter(user => selectedIds.includes(String(user.id)));
  }

  removeIntervenant(userId: string | number): void {
    const currentIds = this.eventForm.get('participantsIds')?.value || [];
    const newIds = currentIds.filter((id: string | number) => String(id) !== String(userId));
    this.eventForm.patchValue({ participantsIds: newIds });
  }

  submitForm() {
    if (this.eventForm.valid) {
      const formValue = this.eventForm.value;

      let startDateTime = new Date(formValue.startDate);
      if (formValue.startTime) {
        const [hours, minutes] = formValue.startTime.split(':');
        startDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      }

      const partsIds = formValue.participantsIds || [];
      const primaryOrganisateur = partsIds.length > 0 ? partsIds[0] : '';

      const eventData: MatterEvent = {
        dossierId: this.dossierId,
        titre: formValue.titre,
        typeId: formValue.typeId,
        startDate: startDateTime,
        endDate: startDateTime, // EndDate identique pour l'instant
        isAllDay: !formValue.startTime,
        lieu: formValue.lieu,
        isVirtual: formValue.lieu?.toLowerCase().includes('teams') || formValue.lieu?.toLowerCase().includes('zoom') ? true : false,
        organisateurId: primaryOrganisateur,
        participantsIds: partsIds,
        reminderMinutesBefore: formValue.reminder ? 1440 : undefined,
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
    }
  }

}
