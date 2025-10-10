import { Component } from '@angular/core';
import { ClientDetail, ClientType, Contact } from '../appTypes';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CalendrierDossier } from "../calendrier/calendrier-dossier/calendrier-dossier";
import { CalendrierJour } from "../calendrier/calendrier-jour/calendrier-jour";



// Interface pour définir la structure d'une Audience Judiciaire
interface Hearing {
  id: number;
  title: string;
  clientCase: string;
  time: string; // Heure de début "HH:mm"
  endTime: string; // Heure de fin "HH:mm"
  location: string;
  status: 'Urgent' | 'Standard' | 'Reporté';
  date: Date;
  style?: any; // Contient les styles calculés: { top: '...', height: '...', width: '...', left: '...' }
}




@Component({
  selector: 'app-test',
  imports: [CommonModule, FormsModule,
    RouterModule, CalendrierDossier, CalendrierJour],
  templateUrl: './test.html',
  styleUrl: './test.css'
})
export class Test {
  public hours = Array.from({ length: 11 }, (_, i) => 8 + i);
    hourHeightPx = 64;
    startHour = 8;

  public daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
  public weekStart: Date = this.getStartOfWeek(new Date());

  // Les événements statiques (Audiences) pour la démo (Mise à jour avec endTime)
  public hearings: Hearing[] = [
    // Lundi (Conflit: 09:00 - 10:30 vs 09:00 - 10:00)
    { id: 101, title: 'Audience Plaidoirie', clientCase: 'SARL Alpha vs Beta', time: '09:00', endTime: '13:30', location: 'Chambre 3', status: 'Standard', date: this.getDateForDay(0, this.weekStart) },
    { id: 107, title: 'Expertise Judiciaire', clientCase: 'Affaire ZYX', time: '09:00', endTime: '13:00', location: 'Bureau Expert', status: 'Urgent', date: this.getDateForDay(0, this.weekStart) },
    { id: 102, title: 'Conférence ME', clientCase: 'Dupont c/ Procureur', time: '11:30', endTime: '12:00', location: 'Greffe', status: 'Standard', date: this.getDateForDay(0, this.weekStart) },

    // Mardi (Conflit: 14:00 - 16:00 vs 14:30 - 15:30)
    { id: 103, title: 'Référé Suspension', clientCase: 'Mme Martin', time: '14:00', endTime: '16:00', location: 'Salle 7', status: 'Urgent', date: this.getDateForDay(1, this.weekStart) },
    { id: 108, title: 'Convocation Officier', clientCase: 'Prêt-Bail', time: '14:30', endTime: '15:30', location: 'Cour App. RDC', status: 'Standard', date: this.getDateForDay(1, this.weekStart) },
    { id: 109, title: 'Consultation', clientCase: 'Nouveau Client', time: '8:00', endTime: '17:00', location: 'Cabinet - Salle A', status: 'Standard', date: this.getDateForDay(1, this.weekStart) },
  ];

  ngOnInit() {
    this.calculateEventStyles();
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
  public getHearingsForDay(dayIndex: number): Hearing[] {
    const targetDate = this.getDateForDay(dayIndex, this.weekStart);

    return this.hearings
      .filter(hearing => hearing.date.toDateString() === targetDate.toDateString())
      .sort((a, b) => a.time.localeCompare(b.time));
  }
}
