import { Component, Input, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Appointement } from '../../appTypes';
import { AppointementService } from '../../services/appointement.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointementDialogComponent } from '../appointement-dialog/appointement-dialog';
import { AlertService } from '../../services/alert-service';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';

@Component({
  selector: 'app-calendrier-jour',
  standalone: true,
  imports: [CommonModule, FormsModule, AppointementDialogComponent, TranslatePipe],
  templateUrl: './calendrier-jour.html',
  styleUrl: './calendrier-jour.css'
})
export class CalendrierJour implements OnInit {

  @Input() date: Date = new Date();

  showAppointementDialog = false;
  selectedTime = '';
  selectedDateStr = '';

  // Paramètres de la grille
  public hours = Array.from({ length: 11 }, (_, i) => 8 + i);
  hourHeightPx = 64;
  startHour = 8;

  public hearings: Appointement[] = [];
  public dayHearings: Appointement[] = [];

  selectedAppointement: Appointement | null = null;

  constructor(private appointementService: AppointementService, private alertService: AlertService) { }

  ngOnInit() {
    this.loadAppointements();
  }

  loadAppointements(): void {
    this.appointementService.findAll(0, 1000).subscribe({
      next: (data: PaginatedResponse<Appointement>) => {
        this.hearings = data.content.map(app => ({
          ...app,
          date: new Date(app.date)
        }));
        this.filterAndCalculateEvents(this.date);
      },
      error: (error) => console.error('Error loading appointements:', error)
    });
  }

  get isDateToday(): boolean {
    const today = new Date();
    return this.date.toDateString() === today.toDateString();
  }

  getCurrentTimeTop(): string | null {
    if (!this.isDateToday) return null;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = this.startHour * 60;
    const endMinutes = (this.startHour + this.hours.length) * 60;

    if (currentMinutes < startMinutes || currentMinutes > endMinutes) return null;

    const topPx = ((currentMinutes - startMinutes) / 60) * this.hourHeightPx;
    return `${topPx}px`;
  }

  public changeDay(offset: number): void {
    const newDate = new Date(this.date);
    newDate.setDate(newDate.getDate() + offset);
    this.date = newDate;
    this.filterAndCalculateEvents(this.date);
  }

  public goToToday(): void {
    this.date = new Date();
    this.filterAndCalculateEvents(this.date);
  }

  private filterAndCalculateEvents(targetDate: Date): void {
    this.dayHearings = this.hearings.filter(appointement =>
      appointement.date.toDateString() === targetDate.toDateString()
    ).sort((a: Appointement, b: Appointement) => a.time.localeCompare(b.time));

    this.calculateEventStyles();
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  public calculateEventStyles() {
    const dayEvents = this.dayHearings;

    // 1. Calcul du TOP et de la HEIGHT
    dayEvents.forEach((event: Appointement) => {
      const startMinutes = this.timeToMinutes(event.time);
      const endMinutes = this.timeToMinutes(event.endTime);

      const minutesFromStart = startMinutes - (this.startHour * 60);
      const durationMinutes = endMinutes - startMinutes;

      const topPx = (minutesFromStart / 60) * this.hourHeightPx;
      const heightPx = (durationMinutes / 60) * this.hourHeightPx;

      event.style = { top: `${topPx}px`, height: `${heightPx}px`, };
    });

    // 2. Gestion des CONFLITS
    dayEvents.forEach((event: Appointement) => {
      const overlappingEvents = dayEvents.filter((other: Appointement) =>
        (other.time < event.endTime && other.endTime > event.time) ||
        (other.id === event.id)
      ).sort((a: Appointement, b: Appointement) => a.time.localeCompare(b.time));

      if (overlappingEvents.length > 1) {
        const groupSize = overlappingEvents.length;
        const eventIndexInGroup = overlappingEvents.findIndex((e: Appointement) => e.id === event.id);

        const widthPercent = (100 / groupSize);
        const leftPercent = eventIndexInGroup * widthPercent;

        event.style.width = `${widthPercent}%`;
        event.style.left = `${leftPercent}%`;
        event.style.zIndex = eventIndexInGroup + 10;
      } else {
        event.style.width = '100%';
        event.style.left = '0%';
        event.style.zIndex = 1;
      }
    });
  }

  public getStatusClass(status: string): string {
    switch (status) {
      case 'Urgent':
        return 'bg-rose-50 border-l-4 border-rose-500 text-rose-950 shadow-sm hover:shadow-md ring-1 ring-rose-200/80';
      case 'Standard':
        return 'bg-indigo-50 border-l-4 border-indigo-500 text-indigo-950 shadow-sm hover:shadow-md ring-1 ring-indigo-200/80';
      case 'Reporté':
        return 'bg-slate-100 border-l-4 border-slate-400 text-slate-600 shadow-sm line-through opacity-75 ring-1 ring-slate-200/80';
      default:
        return 'bg-slate-50 border-l-4 border-slate-300 text-slate-800 shadow-sm';
    }
  }

  public handleGridClick(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const yPosition = event.clientY - rect.top;
    const totalMinutes = (yPosition / this.hourHeightPx) * 60;
    const hours = this.startHour + Math.floor(totalMinutes / 60);
    const minutes = Math.round((totalMinutes % 60) / 15) * 15;

    const normalizedMinutes = minutes === 60 ? 0 : minutes;
    const normalizedHours = minutes === 60 ? hours + 1 : hours;

    const formattedTime = `${String(normalizedHours).padStart(2, '0')}:${String(normalizedMinutes).padStart(2, '0')}`;

    const yyyy = this.date.getFullYear();
    const mm = String(this.date.getMonth() + 1).padStart(2, '0');
    const dd = String(this.date.getDate()).padStart(2, '0');

    this.selectedDateStr = `${yyyy}-${mm}-${dd}`;
    this.selectedTime = formattedTime;
    this.selectedAppointement = null;
    this.showAppointementDialog = true;
  }

  closeAppointementDialog(): void {
    this.loadAppointements();
    this.showAppointementDialog = false;
  }

  onAppointementSaved(): void {
    this.showAppointementDialog = false;
    this.loadAppointements();
  }

  openAddAppointementDialog() {
    this.selectedAppointement = null;
    const yyyy = this.date.getFullYear();
    const mm = String(this.date.getMonth() + 1).padStart(2, '0');
    const dd = String(this.date.getDate()).padStart(2, '0');
    this.selectedDateStr = `${yyyy}-${mm}-${dd}`;
    this.selectedTime = '09:00';
    this.showAppointementDialog = true;
  }

  openEditAppointementDialog(appointement: Appointement) {
    this.selectedAppointement = appointement;
    this.showAppointementDialog = true;
  }

  async deleteAppointement(appointement: Appointement, event: Event) {
    event.stopPropagation();

    const isConfirmed = await this.alertService.confirmMessage(
      'Supprimer la réunion ?',
      `Voulez-vous vraiment supprimer la réunion "${appointement.title}" ?`,
      'warning'
    );

    if (isConfirmed) {
      if (!appointement.id) return;
      this.appointementService.delete(appointement.id).subscribe({
        next: () => {
          this.alertService.success('La réunion a été supprimée avec succès.');
          this.loadAppointements();
        },
        error: (err) => {
          console.error('Failed to delete appointement', err);
        }
      });
    }
  }

}
