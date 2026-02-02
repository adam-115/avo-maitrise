import { Component, OnInit } from '@angular/core';
import { ClientDetail } from '../../appTypes';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-client-details',
  imports: [CommonModule],
  templateUrl: './client-details.html',
  styleUrl: './client-details.css'
})
export class ClientDetails implements OnInit {


  // Client factice pour l'exemple
  client: ClientDetail = {
    totalFiles: 35, // 📄
    activeCases: 4, // 💼
    internalContactsCount: 3, // 👥
    clientContactsCount: 2, // 📞
    documentsToReview: 1, // 🚨
    id: 102,
    type: 'SOCIETE',
    name: 'ALPHA Finance SA',
    legalForm: 'Société Anonyme (SA)',
    siren: '123 456 789',
    role: 'Client Actif - Principal',
    email: 'contact@alpha-finance.com',
    phone: '+33 1 40 00 00 00',
    address: '12 Rue de la Bourse, 75002 Paris',
    country: 'FRANCE',

    amlRisk: 'ELEVEE',
    complianceStatus: 'ALERT',
    isPEP: true, // Risque élevé
    fundsOrigin: 'Capital-risque international',
    beneficialOwners: 'Jean Dubois, Sarah Chen (Vérification Complète)',
    complianceNotes: "Risque élevé justifié par l'actionnaire Sarah Chen (Liée à une PPE étrangère). Dossier validé après revue par le Comité. À surveiller annuellement.",
    validationDate: '2024-05-15',
    archivingStatus: 'PENDING', // Exemple d'alerte sur l'archivage
    createdAt: new Date(), // Ajouté pour correspondre au type
    updatedAt: new Date(), // Ajouté pour correspondre au type

    // Ajout des propriétés manquantes pour correspondre au type ClientDetail
    contacts: [],
    notes: '',
    history: [],
    isActive: true,
    sector: 'Finance', // Ajouté pour correspondre au type ClientDetail
  };

  constructor(private readonly router: Router) { }

  ngOnInit(): void {
    // Ici, vous récupéreriez l'ID du client depuis la route et chargeriez les données.
    // Ex: this.route.paramMap.subscribe(params => { this.loadClient(params.get('id')); });
  }

  // Méthodes pour les interactions (non incluses dans cet exemple)
  startComplianceReview() {

    this.router.navigate(['/home', 'review-aml']);

  }
  editClient() { console.log('Éditer client.'); }



}
