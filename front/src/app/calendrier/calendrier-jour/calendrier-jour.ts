import { Component, Input } from '@angular/core';
import { Hearing } from '../../appTypes';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-calendrier-jour',
  imports: [CommonModule,FormsModule],
  templateUrl: './calendrier-jour.html',
  styleUrl: './calendrier-jour.css'
})
export class CalendrierJour {

  // Propriété pour sélectionner la date affichée
  @Input() date: Date = new Date();

  // Paramètres de la grille
  public hours = Array.from({ length: 11 }, (_, i) => 8 + i); // De 8h à 18h
  hourHeightPx = 64; // 64 pixels par heure
  startHour = 8;

  // Événements pour la journée (Simulé, basé sur l'heure)
  public hearings: Hearing[] = [
    // Événements du jour simulé
    { id: 101, title: 'Audience Plaidoirie', clientCase: 'SARL Alpha vs Beta', time: '09:00', endTime: '10:30', location: 'Chambre 3', status: 'Standard', date: new Date(2025, 9, 10) }, // Exemple 10 Octobre 2025
    { id: 107, title: 'Expertise Judiciaire', clientCase: 'Affaire ZYX', time: '09:00', endTime: '10:00', location: 'Bureau Expert', status: 'Urgent', date: new Date(2025, 9, 10) },
    { id: 102, title: 'Conférence ME', clientCase: 'Dupont c/ Procureur', time: '11:30', endTime: '17:00', location: 'Greffe', status: 'Standard', date: new Date(2025, 9, 10) },
    { id: 110, title: 'Déjeuner Affaire', clientCase: 'Cabinet & Assoc.', time: '12:30', endTime: '18:00', location: 'Restaurant Tiers', status: 'Standard', date: new Date(2025, 9, 10) },
    { id: 103, title: 'Référé Suspension', clientCase: 'Mme Martin', time: '08:00', endTime: '16:00', location: 'Salle 7', status: 'Urgent', date: new Date(2025, 9, 10) },
  ];

  public dayHearings: Hearing[] = [];

  ngOnInit() {
    // Dans une vraie application, vous filtreriez par this.date
    this.dayHearings = this.hearings;
    this.calculateEventStyles();
  }

  // --- LOGIQUE DE CALCUL DES STYLES (Adaptée pour un seul jour) ---

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  public calculateEventStyles() {
    const dayEvents = this.dayHearings;

    // 1. Calcul du TOP et de la HEIGHT (Positionnement vertical)
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

    // 2. Gestion des CONFLITS (Positionnement horizontal)
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
  }

  // --- Fonctions utilitaires ---

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

  public handleGridClick(event: MouseEvent): void {
    // Pourrait ouvrir la modale d'ajout ou afficher une alerte
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const yPosition = event.clientY - rect.top;
    const totalMinutes = (yPosition / this.hourHeightPx) * 60;
    const hours = this.startHour + Math.floor(totalMinutes / 60);
    const minutes = Math.round((totalMinutes % 60) / 15) * 15;

    const normalizedMinutes = minutes === 60 ? 0 : minutes;
    const normalizedHours = minutes === 60 ? hours + 1 : hours;

    const formattedTime = `${String(normalizedHours).padStart(2, '0')}:${String(normalizedMinutes).padStart(2, '0')}`;

    alert(`Journée: Clic à ${formattedTime}. Prêt à ajouter un Hearing.`);
  }


}
