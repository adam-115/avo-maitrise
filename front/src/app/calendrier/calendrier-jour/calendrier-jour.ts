import { Component, Input } from '@angular/core';
import { Appointement } from '../../appTypes';
import { AppointementService } from '../../services/appointement.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointementDialogComponent } from '../appointement-dialog/appointement-dialog';

@Component({
  selector: 'app-calendrier-jour',
  imports: [CommonModule, FormsModule, AppointementDialogComponent],
  templateUrl: './calendrier-jour.html',
  styleUrl: './calendrier-jour.css'
})
export class CalendrierJour {

  // Propriété pour sélectionner la date affichée. Initialisée à la date du jour.
  @Input() date: Date = new Date();

  showAppointementDialog = false;
  selectedTime = '';
  selectedDateStr = '';

  // Paramètres de la grille (inchangés)
  public hours = Array.from({ length: 11 }, (_, i) => 8 + i);
  hourHeightPx = 64;
  startHour = 8;

  public hearings: Appointement[] = [];
  public dayHearings: Appointement[] = [];

  constructor(private appointementService: AppointementService) { }

  ngOnInit() {
    this.loadAppointements();
  }

  loadAppointements(): void {
    this.appointementService.getAll().subscribe({
      next: (data) => {
        this.hearings = data.map(app => ({
          ...app,
          date: new Date(app.date)
        }));
        this.filterAndCalculateEvents(this.date);
      },
      error: (error) => console.error('Error loading appointements:', error)
    });
  }

  // --- NOUVELLES FONCTIONS DE NAVIGATION ET D'INITIALISATION ---

  /**
   * Modifie la date affichée d'un certain nombre de jours.
   * @param offset Nombre de jours (ex: 1 pour demain, -1 pour hier).
   */
  public changeDay(offset: number): void {
    const newDate = new Date(this.date);
    newDate.setDate(newDate.getDate() + offset);
    this.date = newDate;
    this.filterAndCalculateEvents(this.date);
  }

  /**
   * Revient à la date du jour.
   */
  public goToToday(): void {
    this.date = new Date();
    this.filterAndCalculateEvents(this.date);
  }

  /**
   * Filtre les événements pour le jour sélectionné et recalcule leurs styles.
   * @param targetDate La date à filtrer.
   */
  private filterAndCalculateEvents(targetDate: Date): void {
    this.dayHearings = this.hearings.filter(appointement =>
      appointement.date.toDateString() === targetDate.toDateString()
    ).sort((a: Appointement, b: Appointement) => a.time.localeCompare(b.time));

    this.calculateEventStyles();
  }

  // --- Fonctions utilitaires (inchangées, mais appelées par filterAndCalculateEvents) ---

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  public calculateEventStyles() {
    // La logique de positionnement vertical et de gestion des conflits est ici (inchangée)
    // ...
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
      case 'Urgent': return 'bg-red-100 text-red-800 border-red-400';
      case 'Standard': return 'bg-blue-100 text-blue-800 border-blue-400';
      case 'Reporté': return 'bg-gray-100 text-gray-600 border-gray-400 line-through';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  public handleGridClick(event: MouseEvent): void {
    // ... (logique du clic sur la grille inchangée) ...
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
    this.showAppointementDialog = true;
  }

  closeAppointementDialog(): void {
    this.showAppointementDialog = false;
  }

  onAppointementSaved(): void {
    this.showAppointementDialog = false;
    this.loadAppointements();
  }


}
