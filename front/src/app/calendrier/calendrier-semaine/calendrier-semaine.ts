import { Component, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Appointement } from '../../appTypes';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppointementService } from '../../services/appointement.service';
import { AppointementDialogComponent } from '../appointement-dialog/appointement-dialog';
import { AlertService } from '../../services/alert-service';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';

@Component({
  selector: 'app-calendrier-semaine',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AppointementDialogComponent, TranslatePipe],
  templateUrl: './calendrier-semaine.html',
  styleUrl: './calendrier-semaine.css'
})
export class CalendrierSemaine implements OnInit {

  public hours = Array.from({ length: 11 }, (_, i) => 8 + i);
  hourHeightPx = 64;
  startHour = 8;

  public dayKeys = [
    { key: 'CALENDAR.DAYS.MONDAY', index: 0 },
    { key: 'CALENDAR.DAYS.TUESDAY', index: 1 },
    { key: 'CALENDAR.DAYS.WEDNESDAY', index: 2 },
    { key: 'CALENDAR.DAYS.THURSDAY', index: 3 },
    { key: 'CALENDAR.DAYS.FRIDAY', index: 4 }
  ];
  public daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
  public weekStart: Date = this.getStartOfWeek(new Date());

  public hearings: Appointement[] = [];

  showAppointementDialog = false;
  selectedTime = '';
  selectedDateStr = '';

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
        this.calculateEventStyles();
      },
      error: (error) => console.error('Error loading appointements:', error)
    });
  }

  timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  public calculateEventStyles() {
    const eventsByDay = [0, 1, 2, 3, 4].map((index) => {
      const targetDate = this.getDateForDay(index, this.weekStart);
      return this.hearings.filter(event => event.date.toDateString() === targetDate.toDateString());
    });

    eventsByDay.forEach(dayEvents => {
      dayEvents.forEach(event => {
        const startMinutes = this.timeToMinutes(event.time);
        const endMinutes = this.timeToMinutes(event.endTime);

        const minutesFromStart = startMinutes - (this.startHour * 60);
        const durationMinutes = endMinutes - startMinutes;

        const topPx = (minutesFromStart / 60) * this.hourHeightPx;
        const heightPx = (durationMinutes / 60) * this.hourHeightPx;

        event.style = {
          top: `${topPx}px`,
          height: `${heightPx}px`,
        };
      });

      dayEvents.forEach(event => {
        const overlappingEvents = dayEvents.filter(other =>
          (other.time < event.endTime && other.endTime > event.time) ||
          (other.id === event.id)
        ).sort((a, b) => a.time.localeCompare(b.time));

        if (overlappingEvents.length > 1) {
          const groupSize = overlappingEvents.length;
          const eventIndexInGroup = overlappingEvents.findIndex(e => e.id === event.id);

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
    });
  }

  getStartOfWeek(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  getDateForDay(dayIndex: number, startOfWeek: Date): Date {
    const d = new Date(startOfWeek.getTime());
    d.setDate(startOfWeek.getDate() + dayIndex);
    return d;
  }

  isToday(dayIndex: number): boolean {
    const dayDate = this.getDateForDay(dayIndex, this.weekStart);
    const today = new Date();
    return dayDate.toDateString() === today.toDateString();
  }

  getCurrentTimeTop(dayIndex: number): string | null {
    if (!this.isToday(dayIndex)) return null;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = this.startHour * 60;
    const endMinutes = (this.startHour + this.hours.length) * 60;

    if (currentMinutes < startMinutes || currentMinutes > endMinutes) return null;

    const topPx = ((currentMinutes - startMinutes) / 60) * this.hourHeightPx;
    return `${topPx}px`;
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

  public getFormattedDate(dayIndex: number): string {
    const d = this.getDateForDay(dayIndex, this.weekStart);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  }

  public changeWeek(offset: number) {
    const newDate = new Date(this.weekStart.getTime());
    newDate.setDate(this.weekStart.getDate() + (offset * 7));
    this.weekStart = this.getStartOfWeek(newDate);
    this.calculateEventStyles();
  }

  public goToCurrentWeek() {
    this.weekStart = this.getStartOfWeek(new Date());
    this.calculateEventStyles();
  }

  public getHearingsForDay(dayIndex: number): Appointement[] {
    const targetDate = this.getDateForDay(dayIndex, this.weekStart);

    return this.hearings
      .filter(appointement => appointement.date.toDateString() === targetDate.toDateString())
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  public handleGridClick(event: MouseEvent, dayIndex: number): void {
    const targetDate = this.getDateForDay(dayIndex, this.weekStart);

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const yPosition = event.clientY - rect.top;

    const totalMinutes = (yPosition / this.hourHeightPx) * 60;
    const hours = this.startHour + Math.floor(totalMinutes / 60);

    const minutes = Math.round((totalMinutes % 60) / 15) * 15;

    const normalizedMinutes = minutes === 60 ? 0 : minutes;
    const normalizedHours = minutes === 60 ? hours + 1 : hours;

    const formattedTime = `${String(normalizedHours).padStart(2, '0')}:${String(normalizedMinutes).padStart(2, '0')}`;

    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');

    this.selectedDateStr = `${yyyy}-${mm}-${dd}`;
    this.selectedTime = formattedTime;
    this.selectedAppointement = null;
    this.showAppointementDialog = true;
  }

  openAddAppointementDialog() {
    this.selectedAppointement = null;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.selectedDateStr = `${yyyy}-${mm}-${dd}`;
    this.selectedTime = '09:00';
    this.showAppointementDialog = true;
  }

  closeAppointementDialog(): void {
    this.loadAppointements();
    this.showAppointementDialog = false;
  }

  onAppointementSaved(): void {
    this.loadAppointements();
    this.showAppointementDialog = false;
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
