import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Client, ClientTypeEnum, ClientPersonnePhysique, ClientMoral } from '../../appTypes';
import { ClientService } from '../../services/client-service';
import { DossierService } from '../../services/dossier.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'app-partie-selection-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './partie-selection-dialog.html',
})
export class PartieSelectionDialog implements OnInit {
    @Input() roleLabel: string = 'la partie';
    @Input() currentClientId: string | number | null = null;
    @Input() currentAutresParties: any[] = [];
    @Output() confirmSelection = new EventEmitter<Client>();
    @Output() closeDialog = new EventEmitter<void>();

    private readonly clientService = inject(ClientService);
    private readonly dossierService = inject(DossierService);
    private readonly fb = inject(FormBuilder);

    activeTab: 'EXISTANT' | 'NOUVEAU' = 'EXISTANT';

    // Existant Tab
    filteredClients: Client[] = [];
    totalElements = 0;
    selectedClientId: string | number | null = null;
    searchTerm: string = '';
    loading = false;
    currentPage = 1;
    pageSize = 5;

    // Conflict Check
    hasConflict = false;
    conflictMessage = '';

    // Nouveau Tab
    newPartieForm: FormGroup;
    similarContacts: Client[] = [];
    isCheckingSimilar = false;
    private searchSubject = new Subject<string>();

    constructor() {
        this.newPartieForm = this.fb.group({
            type: [ClientTypeEnum.PERSONNE, Validators.required],
            nom: ['', Validators.required],
            prenom: [''], // Only for PERSONNE
            email: ['', [Validators.email]],
            telephone: ['']
        });

        this.searchSubject.pipe(
            debounceTime(500),
            distinctUntilChanged()
        ).subscribe(term => {
            if (term.length > 2) {
                this.checkSimilarContacts(term);
            } else {
                this.similarContacts = [];
            }
        });

        // Trigger search when typing in nom or email
        this.newPartieForm.get('nom')?.valueChanges.subscribe(val => this.triggerSearch());
        this.newPartieForm.get('email')?.valueChanges.subscribe(val => this.triggerSearch());
    }

    getDisplayName(client: any): string {
        if (!client) return '';
        return `${client.nom || client.nomCommercial || ''} ${client.prenom || ''}`.trim();
    }

    ngOnInit(): void {
        this.loadClients();
    }

    // --- Tab EXISTANT ---
    loadClients(): void {
        this.loading = true;
        const filters = { searchTerm: this.searchTerm };
        this.clientService.findAll(this.currentPage - 1, this.pageSize, 'createdAt,desc', filters).subscribe({
            next: (res) => {
                this.filteredClients = res.content || [];
                this.totalElements = res.totalElements;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading clients in dialog', err);
                this.loading = false;
            }
        });
    }

    filterClients(): void {
        this.currentPage = 1;
        this.loadClients();
    }

    get totalPages(): number {
        return Math.ceil(this.totalElements / this.pageSize) || 1;
    }

    get currentEndIndex(): number {
        return Math.min(this.currentPage * this.pageSize, this.totalElements);
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadClients();
        }
    }

    prevPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadClients();
        }
    }

    selectClient(clientId: string | number): void {
        this.selectedClientId = clientId;
        this.hasConflict = false;
        this.conflictMessage = '';
        
        // 1. Check local conflicts first
        if (String(this.currentClientId) === String(clientId)) {
            this.hasConflict = true;
            this.conflictMessage = `Conflit direct : Ce contact est déjà le Client Principal.`;
            return;
        }
        
        const existingPartie = this.currentAutresParties.find(p => String(p.partie.id) === String(clientId));
        if (existingPartie) {
            this.hasConflict = true;
            this.conflictMessage = `Conflit direct : Ce contact est déjà ajouté comme ${existingPartie.role}.`;
            return;
        }

        // 2. Check backend conflicts
        this.dossierService.checkConflict(Number(clientId)).subscribe({
            next: (res) => {
                if (res && res.hasConflict) {
                    this.hasConflict = true;
                    this.conflictMessage = res.message || 'Attention : Un conflit d\'intérêt a été détecté pour cette partie.';
                }
            },
            error: (err) => console.error('Error checking conflict', err)
        });
    }

    isSelected(clientId: string | number): boolean {
        return String(this.selectedClientId) === String(clientId);
    }

    onConfirmExistant(): void {
        if (this.selectedClientId) {
            const selectedClient = this.filteredClients.find(c => String(c.id) === String(this.selectedClientId));
            if (selectedClient) {
                this.confirmSelection.emit(selectedClient);
            }
        }
    }

    // --- Tab NOUVEAU ---

    switchTab(tab: 'EXISTANT' | 'NOUVEAU'): void {
        this.activeTab = tab;
    }

    triggerSearch(): void {
        const nom = this.newPartieForm.get('nom')?.value || '';
        const email = this.newPartieForm.get('email')?.value || '';
        const search = (nom + ' ' + email).trim();
        this.searchSubject.next(search);
    }

    checkSimilarContacts(searchTerm: string): void {
        this.isCheckingSimilar = true;
        this.clientService.findAll(0, 3, 'createdAt,desc', { searchTerm }).subscribe({
            next: (res) => {
                this.similarContacts = res.content || [];
                this.isCheckingSimilar = false;
            },
            error: () => {
                this.isCheckingSimilar = false;
            }
        });
    }

    useSimilarContact(client: Client): void {
        this.confirmSelection.emit(client);
    }

    onConfirmNouveau(): void {
        if (this.newPartieForm.invalid) return;

        this.loading = true;
        const formValue = this.newPartieForm.value;
        
        const newClientData: any = {
            type: formValue.type,
            email: formValue.email,
            telephone: formValue.telephone,
        };

        if (formValue.type === ClientTypeEnum.PERSONNE) {
            newClientData.nom = formValue.nom;
            newClientData.prenom = formValue.prenom;
        } else {
            newClientData.nomCommercial = formValue.nom;
        }

        this.clientService.create(newClientData as Client).subscribe({
            next: (createdClient) => {
                this.loading = false;
                this.confirmSelection.emit(createdClient);
            },
            error: (err) => {
                console.error('Error creating new contact', err);
                this.loading = false;
            }
        });
    }

    onCancel(): void {
        this.closeDialog.emit();
    }
}
