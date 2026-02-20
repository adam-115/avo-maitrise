import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dossier, Client, User, StatutDossier, DossierPriorite, DomaineJuridique } from '../../appTypes';
import { ClientService } from '../../services/client-service';
import { UserService } from '../../services/user.service';
import { MatterStatusService } from '../../services/statut-dossier.service';
import { DossierPrioriteService } from '../../services/dossier-priorite.service';
import { DomaineJuridiqueService } from '../../services/domaine-juridique.service';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-dossier-info',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dossier-info.html',
    styleUrl: './dossier-info.css'
})
export class DossierInfo implements OnInit {
    @Input() dossier?: Dossier | null;

    clients: Client[] = [];
    users: User[] = [];
    statuses: StatutDossier[] = [];
    priorities: DossierPriorite[] = [];
    domaines: DomaineJuridique[] = [];

    constructor(
        private clientService: ClientService,
        private userService: UserService,
        private statusService: MatterStatusService,
        private priorityService: DossierPrioriteService,
        private domaineService: DomaineJuridiqueService
    ) { }

    ngOnInit(): void {
        this.loadDependencies();
    }

    loadDependencies(): void {
        forkJoin({
            clients: this.clientService.getAll(),
            users: this.userService.getAll(),
            statuses: this.statusService.getAll(),
            priorities: this.priorityService.getAll(),
            domaines: this.domaineService.getAll()
        }).subscribe(({ clients, users, statuses, priorities, domaines }) => {
            this.clients = clients;
            this.users = users;
            this.statuses = statuses;
            this.priorities = priorities;
            this.domaines = domaines;
        });
    }

    getClientName(clientId: string | number | undefined): string {
        if (!clientId) return 'Non spécifié';
        const client = this.clients.find(c => c.id == clientId);
        return client ? (client.nom || client.prenom || 'Nom Inconnu') : 'Inconnu';
    }

    getResponsableName(userId: string | undefined): string {
        if (!userId) return 'Non spécifié';
        const user = this.users.find(u => u.id == userId);
        return user ? user.username : 'Inconnu';
    }

    getStatusLabel(statusId: string | undefined): string {
        if (!statusId) return 'Non spécifié';
        const status = this.statuses.find(s => s.id == statusId);
        return status ? status.label : 'Inconnu';
    }

    getStatusColor(statusId: string | undefined): string {
        if (!statusId) return '#ccc';
        const status = this.statuses.find(s => s.id == statusId);
        return status ? (status.color || '#ccc') : '#ccc';
    }

    getPriorityLabel(priorityId: string | undefined): string {
        if (!priorityId) return 'Non spécifié';
        const priority = this.priorities.find(p => p.id == priorityId);
        return priority ? priority.label : 'Inconnu';
    }

    getPriorityColor(priorityId: string | undefined): string {
        if (!priorityId) return 'transparent';
        const priority = this.priorities.find(p => p.id == priorityId);
        return priority ? (priority.color || 'transparent') : 'transparent';
    }

    getDomaineLabel(domaineId: string | undefined): string {
        if (!domaineId) return 'Non spécifié';
        const domaine = this.domaines.find(d => d.id == domaineId);
        return domaine ? domaine.label : 'Inconnu';
    }

    getCollaborateursNames(ids: string[] | undefined): string {
        if (!ids || ids.length === 0) return 'Aucun';
        return ids.map(id => {
            const user = this.users.find(u => u.id == id);
            return user ? user.username : 'Inconnu';
        }).join(', ');
    }

    getBillingInfo(dossier: Dossier): string {
        const method = dossier.methodeFacturation || 'Non défini';
        const rate = dossier.tauxHoraireApplique ? ` (${dossier.tauxHoraireApplique} €/h)` : '';
        return `${method}${rate}`;
    }

    // Mock activities for the UI - normally fetched from a service
    activities = [
        {
            author: 'Maître Dupont',
            action: 'A ajouté le',
            target: 'rapport d\'analyse financière',
            targetType: 'document',
            time: 'Il y a 2 heures',
            color: 'bg-cyan-600'
        },
        {
            author: 'Système',
            action: 'Événement créé :',
            target: 'Audience Préparatoire',
            targetType: 'event',
            time: 'Hier, 16:00',
            color: 'bg-yellow-500',
            highlight: true
        },
        {
            author: 'Maître Martin',
            action: 'A passé',
            target: '3,5 heures',
            targetType: 'time',
            time: 'Il y a 3 jours',
            description: 'sur la rédaction des conclusions.',
            color: 'bg-slate-400'
        }
    ];
}

