import { Component, Input, OnDestroy, OnInit, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Dossier, Client, User, StatutDossier, DossierPriorite, DomaineJuridique, MatterActivity } from '../../appTypes';
import { ClientService } from '../../services/client-service';
import { UserService } from '../../services/user.service';
import { StatutDossierService } from '../../services/statut-dossier.service';
import { DossierPrioriteService } from '../../services/dossier-priorite.service';
import { DomaineJuridiqueService } from '../../services/domaine-juridique.service';
import { MatterActivityService } from '../../services/matter-activity.service';
import { DossierService } from '../../services/dossier.service';
import { DocumentService } from '../../services/document.service';
import { VoiceNoteService } from '../../services/voice-note.service';
import { AlertService } from '../../services/alert-service';
import { forkJoin, firstValueFrom } from 'rxjs';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-dossier-info',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, TranslatePipe],
    templateUrl: './dossier-info.html',
    styleUrl: './dossier-info.css'
})
export class DossierInfo implements OnInit, OnChanges, OnDestroy {
    @Input() dossier?: Dossier | null;

    clients: Client[] = [];
    users: User[] = [];
    statuses: StatutDossier[] = [];
    priorities: DossierPriorite[] = [];
    domaines: DomaineJuridique[] = [];
    activities: MatterActivity[] = [];

    // Audio & dictée rapide de la description depuis la vue d'ensemble
    audioUrl: string | null = null;
    editingDescription = false;
    draftDescription = '';
    isRecording = false;
    interimTranscript = '';
    voiceError = '';
    recordedBlob: Blob | null = null;
    recordedMime = 'audio/webm';
    draftAudioDocId: number | null = null;
    savingDescription = false;
    structuringWithAi = false;

    private clientService = inject(ClientService);
    private userService = inject(UserService);
    private statusService = inject(StatutDossierService);
    private priorityService = inject(DossierPrioriteService);
    private domaineService = inject(DomaineJuridiqueService);
    private activityService = inject(MatterActivityService);
    private dossierService = inject(DossierService);
    private documentService = inject(DocumentService);
    private voiceNoteService = inject(VoiceNoteService);
    private alertService = inject(AlertService);
    private translate = inject(TranslateService);

    constructor() { }

    ngOnInit(): void {
        this.loadDependencies();
        this.loadActivities();
        this.loadSavedAudio();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['dossier'] && this.dossier) {
            this.loadActivities();
            this.loadSavedAudio();
        }
    }

    ngOnDestroy(): void {
        this.stopDictation();
        this.revokeAudioUrl();
    }

    private revokeAudioUrl(): void {
        if (this.audioUrl) {
            URL.revokeObjectURL(this.audioUrl);
            this.audioUrl = null;
        }
    }

    private loadSavedAudio(): void {
        this.revokeAudioUrl();
        const docId = this.dossier?.descriptionAudioDocumentId;
        if (docId) {
            this.documentService.downloadDocumentFile(docId).subscribe({
                next: (blob) => {
                    this.revokeAudioUrl();
                    this.audioUrl = URL.createObjectURL(blob);
                },
                error: () => {
                    // Audio non disponible
                }
            });
        }
    }

    openDescriptionEditor(): void {
        this.editingDescription = true;
        this.draftDescription = this.dossier?.description || '';
        this.draftAudioDocId = this.dossier?.descriptionAudioDocumentId ?? null;
        this.recordedBlob = null;
        this.voiceError = '';
    }

    cancelDescriptionEditor(): void {
        this.stopDictation();
        this.editingDescription = false;
        this.recordedBlob = null;
        this.voiceError = '';
        this.loadSavedAudio();
    }

    async toggleDictation(): Promise<void> {
        if (this.isRecording) {
            this.stopDictation();
            return;
        }
        this.voiceError = '';
        this.interimTranscript = '';
        const currentLang = this.translate.getCurrentLang();
        const lang = currentLang === 'en' ? 'en-US' : (currentLang === 'ar' ? 'ar-MA' : 'fr-FR');

        const audioStarted = await this.voiceNoteService.startAudioRecording((blob, mimeType) => {
            this.recordedBlob = blob;
            this.recordedMime = mimeType;
            this.revokeAudioUrl();
            this.audioUrl = URL.createObjectURL(blob);
        });

        const speechStarted = this.voiceNoteService.startRecognition(lang, {
            onFinal: (chunk) => {
                const current = this.draftDescription.trim();
                this.draftDescription = current ? `${current} ${chunk}` : chunk;
            },
            onInterim: (text) => {
                this.interimTranscript = text;
            },
            onError: (msg) => {
                this.voiceError = msg;
            },
            onEnd: () => {
                this.interimTranscript = '';
                if (this.isRecording) {
                    this.isRecording = false;
                    this.voiceNoteService.stopAudioRecording();
                }
            }
        });

        if (audioStarted || speechStarted) {
            this.isRecording = true;
        } else if (!this.voiceError) {
            this.voiceError = 'Impossible d\'accéder au microphone.';
        }
    }

    stopDictation(): void {
        this.isRecording = false;
        this.interimTranscript = '';
        this.voiceNoteService.stopRecognition();
        this.voiceNoteService.stopAudioRecording();
    }

    removeDraftAudio(): void {
        this.recordedBlob = null;
        this.draftAudioDocId = null;
        this.revokeAudioUrl();
    }

    polishDraftWithAi(): void {
        const raw = this.draftDescription.trim();
        if (!raw || this.structuringWithAi) return;
        this.structuringWithAi = true;
        const idNum = this.dossier?.id ? Number(this.dossier.id) : null;
        this.voiceNoteService.structureTranscript(raw, idNum).subscribe({
            next: (res) => {
                if (res?.structuredContent) {
                    this.draftDescription = res.structuredContent;
                }
                this.structuringWithAi = false;
            },
            error: () => {
                this.structuringWithAi = false;
                this.alertService.displayMessage('IA indisponible', 'Impossible de reformuler la description pour le moment.', 'warning');
            }
        });
    }

    async saveDescription(): Promise<void> {
        if (!this.dossier?.id || this.savingDescription) return;
        this.stopDictation();
        this.savingDescription = true;

        try {
            let finalAudioId = this.draftAudioDocId;
            if (this.recordedBlob) {
                const base64 = await this.voiceNoteService.blobToBase64(this.recordedBlob);
                const ext = this.recordedMime.includes('mp4') ? 'm4a' : (this.recordedMime.includes('ogg') ? 'ogg' : 'webm');
                const fileName = `description-dossier-${this.dossier.id}-${Date.now()}.${ext}`;
                const savedDoc: any = await firstValueFrom(this.documentService.create({
                    nomFichier: fileName,
                    filename: fileName,
                    title: 'Audio de la description du dossier',
                    tags: 'AUDIO_DESCRIPTION',
                    typeDocument: 'DOSSIER',
                    fileData: base64,
                    dossierId: Number(this.dossier.id),
                    clientId: this.dossier.client?.id ? Number(this.dossier.client.id) : undefined
                } as any));
                finalAudioId = Number(savedDoc.id);
            }

            const updated = await firstValueFrom(
                this.dossierService.updateDescription(this.dossier.id, this.draftDescription, finalAudioId)
            );
            this.dossier.description = updated.description;
            this.dossier.descriptionAudioDocumentId = updated.descriptionAudioDocumentId ?? finalAudioId;
            this.editingDescription = false;
            this.recordedBlob = null;
            this.savingDescription = false;
            this.alertService.success('Description et audio enregistrés');
            this.loadActivities();
        } catch (err) {
            console.error('Erreur enregistrement description audio', err);
            this.savingDescription = false;
            this.alertService.displayMessage('Erreur', 'Impossible d\'enregistrer la description audio.', 'error');
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

    getClientName(client: any): string {
        if (!client) return 'Inconnu';
        if (client.type === 'SOCIETE') return client.nomCommercial || client.nom || 'Société';
        if (client.nom || client.prenom) return `${client.prenom || ''} ${client.nom || ''}`.trim();
        return 'Inconnu';
    }

    getClientInitials(client: any): string {
        if (!client) return '?';
        if (client.type === 'SOCIETE' && client.nomCommercial) {
            return client.nomCommercial.substring(0, 2).toUpperCase();
        }
        const first = client.prenom ? client.prenom.charAt(0) : '';
        const last = client.nom ? client.nom.charAt(0) : '';
        const initials = (first + last).toUpperCase();
        return initials || '?';
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

