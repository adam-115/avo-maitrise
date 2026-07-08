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

    getDossierClientName(dossier: Dossier | undefined | null): string {
        if (!dossier || (!dossier.client && !dossier.clientId)) return 'Non spécifié';
        let client: any = dossier.client;
        if (!client && dossier.clientId) {
            client = this.clients.find(c => c.id == dossier.clientId);
        }
        return client ? (client.nom || client.nomCommercial || client.prenom || 'Nom Inconnu') : 'Inconnu';
    }

    getResponsableName(userOrId: any): string {
        if (!userOrId) return 'Non spécifié';
        if (typeof userOrId === 'object' && userOrId.username) return userOrId.username;
        const user = this.users.find(u => String(u.id) === String(userOrId));
        return user ? user.username : 'Inconnu';
    }

    getStatusLabel(statusOrId: any): string {
        if (!statusOrId) return 'Non spécifié';
        if (typeof statusOrId === 'object' && statusOrId.label) return statusOrId.label;
        const status = this.statuses.find(s => String(s.id) === String(statusOrId));
        return status ? status.label : 'Inconnu';
    }

    getStatusColor(statusOrId: any): string {
        if (!statusOrId) return '#ccc';
        if (typeof statusOrId === 'object' && statusOrId.color) return statusOrId.color;
        const status = this.statuses.find(s => String(s.id) === String(statusOrId));
        return status ? (status.color || '#ccc') : '#ccc';
    }

    getPriorityLabel(priorityOrId: any): string {
        if (!priorityOrId) return 'Non spécifié';
        if (typeof priorityOrId === 'object' && priorityOrId.label) return priorityOrId.label;
        const priority = this.priorities.find(p => String(p.id) === String(priorityOrId));
        return priority ? priority.label : 'Inconnu';
    }

    getPriorityColor(priorityOrId: any): string {
        if (!priorityOrId) return 'transparent';
        if (typeof priorityOrId === 'object' && priorityOrId.color) return priorityOrId.color;
        const priority = this.priorities.find(p => String(p.id) === String(priorityOrId));
        return priority ? (priority.color || 'transparent') : 'transparent';
    }

    getDomaineLabel(domaineOrId: any): string {
        if (!domaineOrId) return 'Non spécifié';
        if (typeof domaineOrId === 'object' && domaineOrId.label) return domaineOrId.label;
        const domaine = this.domaines.find(d => String(d.id) === String(domaineOrId));
        return domaine ? domaine.label : 'Inconnu';
    }

    getCollaborateursNames(ids: any[] | undefined): string {
        if (!ids || ids.length === 0) return 'Aucun';
        return ids.map(item => {
            if (!item) return 'Inconnu';
            if (typeof item === 'object' && item.username) return item.username;
            const user = this.users.find(u => String(u.id) === String(item));
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

