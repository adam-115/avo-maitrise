import { Component, inject, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatterEvent, User } from '../../appTypes';
import { AlertService } from '../../services/alert-service';
import { MatterEventService } from '../../services/matter-event.service';
import { UserService } from '../../services/user.service';
import { EvenementDialogComponent } from './../evenement-dialog/evenement-dialog.component';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { EventTypeService } from '../../services/event-type.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-evenement',
  standalone: true,
  imports: [EvenementDialogComponent, CommonModule, FormsModule, TranslatePipe],
  templateUrl: './evenement.component.html',
  styleUrl: './evenement.component.css'
})
export class EvenementComponent implements OnInit, OnChanges {

  @Input({ required: true }) dossierId!: string;
  @Input() selectedDossier: any = null;
  @Input() dossier: any = null;

  matterEventService = inject(MatterEventService);
  alertService = inject(AlertService);
  userService = inject(UserService);
  eventTypeService = inject(EventTypeService);

  showDialog = false;
  events: MatterEvent[] = [];
  users: User[] = [];
  eventTypes: any[] = [];
  selectedEvent: MatterEvent | null = null;
  viewedEvent: MatterEvent | null = null;
  isLoading = false;

  // Search & Filter
  searchTerm = '';
  selectedCategory = 'ALL';
  selectedStatus = 'ALL';

  // Pagination
  currentPage = 1; // 1-indexed for UI
  pageSize = 6;
  totalElements = 0;
  totalPages = 0;

  ngOnInit(): void {
    this.loadUsers();
    this.loadEventTypes();
    this.loadEvents();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dossierId'] || changes['selectedDossier'] || changes['dossier']) {
      this.currentPage = 1;
      this.loadEvents();
    }
  }

  get activeDossierId(): string {
    return this.dossierId || this.selectedDossier?.id || this.dossier?.id || '';
  }

  loadUsers(): void {
    this.userService.getAll().subscribe({
      next: (data: PaginatedResponse<User>) => {
        this.users = data.content || [];
      },
      error: () => {}
    });
  }

  loadEventTypes(): void {
    this.eventTypeService.getAll().subscribe({
      next: (data: PaginatedResponse<any>) => {
        this.eventTypes = data.content || [];
      },
      error: () => {}
    });
  }

  loadEvents(): void {
    const id = this.activeDossierId;
    if (id) {
      this.isLoading = true;
      this.matterEventService.getByDossierId(
        id,
        this.currentPage - 1,
        this.pageSize
      ).subscribe({
        next: (response) => {
          this.events = response.content || response || [];
          this.totalElements = response.totalElements !== undefined ? response.totalElements : this.events.length;
          this.totalPages = response.totalPages !== undefined ? response.totalPages : Math.ceil(this.totalElements / this.pageSize);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching events:', err);
          this.isLoading = false;
        }
      });
    } else {
      this.events = [];
      this.isLoading = false;
    }
  }

  get filteredEvents(): MatterEvent[] {
    let list = this.events || [];

    // Filter by search term
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      list = list.filter(e => {
        const title = (e.titre || '').toLowerCase();
        const lieu = (e.lieu || '').toLowerCase();
        const desc = (e.description || '').toLowerCase();
        const cat = (e.categorie?.label || e.categorie?.code || '').toLowerCase();
        const participants = (e.participantsIds || []).map(pid => this.getUserName(pid).toLowerCase()).join(' ');
        return title.includes(term) || lieu.includes(term) || desc.includes(term) || cat.includes(term) || participants.includes(term);
      });
    }

    // Filter by Category
    if (this.selectedCategory !== 'ALL') {
      list = list.filter(e => {
        const catId = e.categorie ? String(e.categorie.id) : '';
        return catId === this.selectedCategory;
      });
    }

    // Filter by Status
    if (this.selectedStatus !== 'ALL') {
      list = list.filter(e => (e.statut || 'CONFIRME') === this.selectedStatus);
    }

    return list;
  }

  getUserName(userId: string | number): string {
    if (!userId) return 'Non assigné';
    const user = this.users.find(u => String(u.id) === String(userId));
    return user ? user.username : `Utilisateur #${userId}`;
  }

  getUserInitials(userId: string | number): string {
    const name = this.getUserName(userId);
    return name.substring(0, 2).toUpperCase();
  }

  getParticipantsUsers(event: MatterEvent): User[] {
    if (!event.participantsIds || event.participantsIds.length === 0) return [];
    const ids = event.participantsIds.map(id => String(id));
    return this.users.filter(u => ids.includes(String(u.id)));
  }

  getEventTheme(event: MatterEvent | undefined) {
    if (!event || !event.categorie) {
      return {
        badge: 'bg-slate-100 text-slate-700 border-slate-200',
        cardBorder: 'border-slate-200 hover:border-slate-300',
        dateBg: 'bg-slate-100 text-slate-700',
        iconColor: 'text-slate-500',
        label: 'Événement',
        icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
      };
    }

    const catName = (event.categorie.label || event.categorie.code || '').toUpperCase();
    const catId = String(event.categorie.id);

    if (catName.includes('AUDIENCE') || catName.includes('PROCES') || catId === '1') {
      return {
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
        cardBorder: 'border-rose-100 hover:border-rose-300',
        dateBg: 'bg-rose-100 text-rose-700',
        iconColor: 'text-rose-600',
        label: event.categorie.label || 'Audience',
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
      };
    } else if (catName.includes('RDV') || catName.includes('CLIENT') || catId === '2') {
      return {
        badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        cardBorder: 'border-indigo-100 hover:border-indigo-300',
        dateBg: 'bg-indigo-100 text-indigo-700',
        iconColor: 'text-indigo-600',
        label: event.categorie.label || 'Rendez-vous',
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
      };
    } else if (catName.includes('DELAI') || catName.includes('ECHEANCE') || catName.includes('REUNION')) {
      return {
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        cardBorder: 'border-amber-100 hover:border-amber-300',
        dateBg: 'bg-amber-100 text-amber-700',
        iconColor: 'text-amber-600',
        label: event.categorie.label || 'Échéance',
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
      };
    } else {
      return {
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        cardBorder: 'border-emerald-100 hover:border-emerald-300',
        dateBg: 'bg-emerald-100 text-emerald-700',
        iconColor: 'text-emerald-600',
        label: event.categorie.label || 'Autre',
        icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
      };
    }
  }

  getStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'CONFIRME':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REPORTE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'TERMINE':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'ANNULE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  }

  openModal(): void {
    this.selectedEvent = null;
    this.showDialog = true;
  }

  editEvent(event: MatterEvent): void {
    this.selectedEvent = event;
    this.showDialog = true;
  }

  closeModal(): void {
    this.showDialog = false;
    this.selectedEvent = null;
  }

  viewEventDetails(event: MatterEvent): void {
    this.viewedEvent = event;
  }

  closeViewModal(): void {
    this.viewedEvent = null;
  }

  addMatterEvent(matterEvent: MatterEvent): void {
    this.matterEventService.create(matterEvent).subscribe({
      next: () => {
        this.alertService.success('Événement ajouté avec succès');
        this.loadEvents();
        this.closeModal();
      },
      error: (error) => {
        this.alertService.displayMessage('Erreur', "Échec de l'ajout de l'événement", 'error');
        console.error('Error adding matter event:', error);
      }
    });
  }

  updateMatterEvent(matterEvent: MatterEvent): void {
    if (!matterEvent.id) return;
    this.matterEventService.update(matterEvent).subscribe({
      next: () => {
        this.alertService.success('Événement mis à jour avec succès');
        this.loadEvents();
        this.closeModal();
      },
      error: (error) => {
        this.alertService.displayMessage('Erreur', 'Échec de la mise à jour de l\'événement', 'error');
        console.error('Error updating matter event:', error);
      }
    });
  }

  async deleteEvent(eventId: string | number): Promise<void> {
    const confirmation = await this.alertService.confirmMessage(
      'Suppression',
      'Êtes-vous sûr de vouloir supprimer définitivement cet événement ?',
      'warning'
    );

    if (confirmation) {
      this.matterEventService.delete(String(eventId)).subscribe({
        next: () => {
          this.alertService.success('Événement supprimé avec succès');
          this.loadEvents();
        },
        error: (error) => {
          this.alertService.displayMessage('Erreur', 'Erreur lors de la suppression de l\'événement', 'error');
          console.error('Error deleting event:', error);
        }
      });
    }
  }

  // Pagination
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadEvents();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadEvents();
    }
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadEvents();
    }
  }

  getPageArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  trackByEventId(index: number, ev: MatterEvent): any {
    return ev.id || index;
  }
}
