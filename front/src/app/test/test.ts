import { Component } from '@angular/core';
import { ClientDetail, ClientType, Contact } from '../appTypes';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-test',
  imports: [CommonModule, FormsModule,
    RouterModule],
  templateUrl: './test.html',
  styleUrl: './test.css'
})
export class Test {

   // ... supposons que 'client' est chargé depuis l'ID de la route
    client!: ClientDetail;
    todayDate: string = '';

    constructor() {}

    ngOnInit(): void {

    }

    onSubmitReview() {
        // Logique de soumission :
        // 1. Récupérer les données du formulaire (justification, dates, checklist)
        // 2. Enregistrer le nouvel événement d'historique de revue.
        // 3. Mettre à jour le statut du client à client.complianceStatus = 'PENDING'.
        // 4. Rediriger vers la page de détails client.
        console.log('Nouvelle revue AML lancée et enregistrée.');
    }

}
