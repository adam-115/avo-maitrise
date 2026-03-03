import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatterEvent, User } from '../../appTypes';
import { AlertService } from '../../services/alert-service';
import { MatterEventService } from '../../services/matter-event.service';
import { UserService } from '../../services/user.service';
import { EvenementDialogComponent } from './../evenement-dialog/evenement-dialog.component';

@Component({
  selector: 'app-evenement',
  imports: [EvenementDialogComponent, CommonModule],
  templateUrl: './evenement.component.html',
  styleUrl: './evenement.component.css'
})
export class EvenementComponent implements OnInit {

  @Input({ required: true })
  dossierId!: string;
  matterEventService = inject(MatterEventService);
  alertService = inject(AlertService);
  userService = inject(UserService);

  showDialog = false;
  events: MatterEvent[] = [];
  users: User[] = [];
  selectedEvent: MatterEvent | null = null;
  viewedEvent: MatterEvent | null = null;

  ngOnInit() {
    this.userService.getAll().subscribe(data => this.users = data);
    this.loadEvents();
  }

  getUserName(userId: string | number): string {
    if (!userId) return 'Non assigné';
    const user = this.users.find(u => String(u.id) === String(userId));
    return user ? user.username : `Utilisateur ${userId}`;
  }

  loadEvents() {
    this.matterEventService.getAll().subscribe(res => {
      this.events = res.filter(e => String(e.dossierId) === String(this.dossierId));
    });
  }

  getEventTheme(typeId: string | number) {
    const typeStr = String(typeId).toUpperCase();
    if (typeStr.includes('AUDIENCE') || typeStr === '1') {
      return {
        border: 'border-red-500',
        text: 'text-red-600',
        label: 'Audience / Procédure',
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
      };
    } else if (typeStr.includes('RDV') || typeStr === '2') {
      return {
        border: 'border-cyan-600',
        text: 'text-cyan-600',
        label: 'Rendez-vous',
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20h-5v-2a3 3 0 00-5.356-1.857M9 20H4v-2a3 3 0 015-2.236M9 18V5l-2-1m-2-1h6a4 4 0 014 4v8m-10 0h10a4 4 0 004-4V5a4 4 0 00-4-4h-6a4 4 0 00-4 4v8z'
      };
    } else {
      return {
        border: 'border-gray-400',
        text: 'text-gray-600',
        label: 'Échéance / Réunion',
        icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
      };
    }
  }


  openModal() {
    this.selectedEvent = null;
    this.showDialog = true;
  }

  editEvent(event: MatterEvent) {
    this.selectedEvent = event;
    this.showDialog = true;
  }


  closeModal() {
    this.showDialog = false;
  }

  viewEventDetails(event: MatterEvent) {
    this.viewedEvent = event;
  }

  closeViewModal() {
    this.viewedEvent = null;
  }

  addMatterEvent(matterEvent: MatterEvent) {
    this.matterEventService.create(matterEvent).subscribe({
      next: (newEvent) => {
        this.alertService.displayMessage('Événement ajouté avec succès', 'success', 'success');
        this.events.push(newEvent);
        this.closeModal();
      },
      error: (error) => {
        this.alertService.displayMessage("Échec de l'ajout de l'événement", 'error', 'error');
        console.error('Error adding matter event:', error);
      }
    });
  }


  updateMatterEvent(matterEvent: MatterEvent) {
    if (!matterEvent.id) return;
    this.matterEventService.update(matterEvent.id, matterEvent).subscribe({
      next: (updatedEvent) => {
        this.alertService.displayMessage('Événement mis à jour avec succès', 'success', 'success');
        const index = this.events.findIndex(e => e.id === updatedEvent.id);
        if (index !== -1) {
          this.events[index] = updatedEvent;
        }
        this.closeModal();
      },
      error: (error) => {
        this.alertService.displayMessage('Échec de la mise à jour', 'error', 'error');
        console.error('Error updating matter event:', error);
      }
    });
  }

  async deleteEvent(eventId: string) {
    const confirmation = await this.alertService.confirmMessage(
      'Êtes-vous sûr ?',
      'Cette action est irréversible, cet événement sera définitivement supprimé.',
      'warning'
    );

    if (confirmation) {
      this.matterEventService.delete(eventId).subscribe({
        next: () => {
          this.alertService.success('Événement supprimé avec succès');
          this.events = this.events.filter(e => e.id !== eventId);
        },
        error: (error) => {
          this.alertService.displayMessage('Erreur lors de la suppression', 'error', 'error');
          console.error('Error deleting event:', error);
        }
      });
    }
  }




}
