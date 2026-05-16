import { Component, Input, OnInit, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dossier, Client, User, StatutDossier, DossierPriorite, DomaineJuridique, MatterActivity } from '../../appTypes';
import { ClientService } from '../../services/client-service';
import { UserService } from '../../services/user.service';
import { StatutDossierService } from '../../services/statut-dossier.service';
import { DossierPrioriteService } from '../../services/dossier-priorite.service';
import { DomaineJuridiqueService } from '../../services/domaine-juridique.service';
import { MatterActivityService } from '../../services/matter-activity.service';
import { forkJoin } from 'rxjs';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';

@Component({
    selector: 'app-dossier-info',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dossier-info.html',
    styleUrl: './dossier-info.css'
})
export class DossierInfo implements OnInit, OnChanges {
    @Input() dossier?: Dossier | null;

    clients: Client[] = [];
    users: User[] = [];
    statuses: StatutDossier[] = [];
    priorities: DossierPriorite[] = [];
    domaines: DomaineJuridique[] = [];
    activities: MatterActivity[] = [];

    private clientService = inject(ClientService);
    private userService = inject(UserService);
    private statusService = inject(StatutDossierService);
    private priorityService = inject(DossierPrioriteService);
    private domaineService = inject(DomaineJuridiqueService);
    private activityService = inject(MatterActivityService);

    constructor() { }

    ngOnInit(): void {
        this.loadDependencies();
        this.loadActivities();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['dossier'] && this.dossier) {
            this.loadActivities();
        }
    }

    loadDependencies(): void {
        forkJoin({
            clients: this.clientService.getAll() as any,
            users: this.userService.getAll() as any,
            statuses: this.statusService.getAll() as any,
            priorities: this.priorityService.getAll() as any,
            domaines: this.domaineService.getAll() as any
        }).subscribe(({ clients, users, statuses, priorities, domaines }) => {
            this.clients = (clients as any).content;
            this.users = (users as any).content;
            this.statuses = (statuses as any).content;
            this.priorities = (priorities as any).content;
            this.domaines = (domaines as any).content;
        });
    }

    loadActivities(): void {
        if (this.dossier && this.dossier.id) {
            this.activityService.getActivitiesByDossier(this.dossier.id).subscribe(data => {
                this.activities = data.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA;
                });
            });
        } else {
            this.activities = [];
        }
    }

    getClientName(clientId: string | number | undefined): string {
        if (!clientId) return 'Non spécifié';
        const client = this.clients.find(c => c.id == clientId) as any;
        return client ? (client.nom || client.nomCommercial || client.prenom || 'Nom Inconnu') : 'Inconnu';
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

    getActivityColor(type: string): string {
        switch (type) {
            case 'Tâche': return 'bg-blue-500';
            case 'Note': return 'bg-cyan-600';
            case 'Événement': return 'bg-yellow-500';
            case 'Document': return 'bg-purple-500';
            case 'Dossier': return 'bg-green-500';
            default: return 'bg-slate-400';
        }
    }
}

