import { Component, OnInit } from '@angular/core';
import { Appointement } from '../../appTypes';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppointementService } from '../../services/appointement.service';
import { AppointementDialogComponent } from '../appointement-dialog/appointement-dialog';
import { AlertService } from '../../services/alert-service';

@Component({
  selector: 'app-calendrier-semaine',
  imports: [CommonModule, FormsModule, RouterModule, AppointementDialogComponent],
  templateUrl: './calendrier-semaine.html',
  styleUrl: './calendrier-semaine.css'
})
export class CalendrierSemaine implements OnInit {

  public hours = Array.from({ length: 11 }, (_, i) => 8 + i);
  hourHeightPx = 64;
  startHour = 8;

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
    this.appointementService.getAll().subscribe({
      next: (data) => {
        // Convert the ISO string dates back to Javascript Date objects
        this.hearings = data.map(app => ({
          ...app,
          date: new Date(app.date)
        }));
        this.calculateEventStyles();
      },
      error: (error) => console.error('Error loading appointements:', error)
    });
  }

  // --- LOGIQUE CRITIQUE DE CALCUL DES STYLES ---

  timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  public calculateEventStyles() {
    // 1. Groupement des événements par jour
    const eventsByDay = this.daysOfWeek.map((dayName, index) => {
      const targetDate = this.getDateForDay(index, this.weekStart);
      return this.hearings.filter(event => event.date.toDateString() === targetDate.toDateString());
    });

    eventsByDay.forEach(dayEvents => {
      // 2. Calcul du TOP et de la HEIGHT (Positionnement vertical)
      dayEvents.forEach(event => {
        const startMinutes = this.timeToMinutes(event.time);
        const endMinutes = this.timeToMinutes(event.endTime);

        const minutesFromStart = startMinutes - (this.startHour * 60);
        const durationMinutes = endMinutes - startMinutes;

        // Calcul du TOP et de la HEIGHT en pixels
        const topPx = (minutesFromStart / 60) * this.hourHeightPx;
        const heightPx = (durationMinutes / 60) * this.hourHeightPx;

        event.style = {
          top: `${topPx}px`,
          height: `${heightPx}px`,
        };
      });

      // 3. Gestion des CONFLITS (Positionnement horizontal - width et left)
      dayEvents.forEach(event => {
        // Trouver tous les événements qui chevauchent l'événement courant (y compris lui-même pour l'algorithme)
        const overlappingEvents = dayEvents.filter(other =>
          (other.time < event.endTime && other.endTime > event.time) || // Standard chevauchement A.time < B.endTime && A.endTime > B.time
          (other.id === event.id) // Inclure l'événement lui-même
        ).sort((a, b) => a.time.localeCompare(b.time)); // Tri pour un positionnement stable

        // Si un chevauchement existe, déterminer la largeur et la position relative
        if (overlappingEvents.length > 1) {
          const groupSize = overlappingEvents.length;
          const eventIndexInGroup = overlappingEvents.findIndex(e => e.id === event.id);

          // Diviser l'espace horizontal disponible
          const widthPercent = (100 / groupSize);
          const leftPercent = eventIndexInGroup * widthPercent;

          event.style.width = `${widthPercent}%`;
          event.style.left = `${leftPercent}%`;
          event.style.zIndex = eventIndexInGroup + 10; // Pour garantir que les événements superposés sont visibles
        } else {
          // Pas de chevauchement: utiliser toute la largeur
          event.style.width = '100%';
          event.style.left = '0%';
          event.style.zIndex = 1;
        }
      });
    });
  }

  // --- Fonctions de navigation et utilitaires (inchangées) ---

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

  public getStatusClass(status: string): string {
    switch (status) {
      case 'Urgent':
        return 'bg-red-100 text-red-800 border-red-400';
      case 'Standard':
        return 'bg-blue-100 text-blue-800 border-blue-400';
      case 'Reporté':
        return 'bg-gray-100 text-gray-600 border-gray-400 line-through';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  public getFormattedDate(dayIndex: number): string {
    return this.getDateForDay(dayIndex, this.weekStart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
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

  /**
   * Récupère les audiences pour un jour spécifique (simplement filtrées et triées).
   */
  public getHearingsForDay(dayIndex: number): Appointement[] {
    const targetDate = this.getDateForDay(dayIndex, this.weekStart);

    return this.hearings
      .filter(appointement => appointement.date.toDateString() === targetDate.toDateString())
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  showHiringDetails(appointement: Appointement) {
    alert(`Détails de l'audience:\n\nTitre: ${appointement.title}\nDossier: ${appointement.clientCase}\nHeure: ${appointement.time} - ${appointement.endTime}\nLieu: ${appointement.location}\nStatut: ${appointement.status}`);
  }

  // NOUVELLE MÉTHODE POUR GÉRER LE CLIC SUR LA GRILLE
  public handleGridClick(event: MouseEvent, dayIndex: number): void {

    // 1. Obtenir la date et le nom du jour
    const targetDate = this.getDateForDay(dayIndex, this.weekStart);
    const dayName = this.daysOfWeek[dayIndex];

    // 2. Calculer la position verticale du clic dans le conteneur du jour
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const yPosition = event.clientY - rect.top;

    // 3. Convertir la position Y en heures/minutes (arrondi à 15 minutes)
    const totalMinutes = (yPosition / this.hourHeightPx) * 60;
    const hours = this.startHour + Math.floor(totalMinutes / 60);

    // Snap to 15-minute intervals (15, 30, 45, 60)
    const minutes = Math.round((totalMinutes % 60) / 15) * 15;

    // Gérer l'arrondi qui dépasse 60 (ex: 52 arrondi à 60)
    const normalizedMinutes = minutes === 60 ? 0 : minutes;
    const normalizedHours = minutes === 60 ? hours + 1 : hours;

    const formattedTime = `${String(normalizedHours).padStart(2, '0')}:${String(normalizedMinutes).padStart(2, '0')}`;

    // 4. Mettre à jour les variables et ouvrir la modale
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');

    this.selectedDateStr = `${yyyy}-${mm}-${dd}`;
    this.selectedTime = formattedTime;
    this.showAppointementDialog = true;
  }

  openAddAppointementDialog() {
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
    event.stopPropagation(); // Avoid opening the edit dialog

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
          this.loadAppointements(); // Reload data to remove it from UI
        },
        error: (err) => {
          console.error('Failed to delete appointement', err);
        }
      });
    }
  }

}
