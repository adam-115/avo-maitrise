import { Component, inject, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Dossier, DossierContact } from '../../appTypes';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DossierContactService } from '../../services/dossier-contact.service';
import { AlertService } from '../../services/alert-service';
import { PaginatedResponse } from '../../services/genericService/abstract-crud.service';
import { ContactDialog } from '../contact-dialog/contact-dialog';

@Component({
  selector: 'app-contact',
  imports: [ContactDialog, FormsModule, CommonModule, TranslatePipe],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent implements OnInit, OnChanges {
  @Input() dossierId: string | number = '';
  @Input() dossierID: string | number = '';
  @Input() dossierNumber: string = '';
  @Input() selectedDossier: Dossier | null = null;
  @Input() dossier: Dossier | null = null;

  contacts: DossierContact[] = [];
  searchTerm: string = '';
  selectedRoleFilter: string = '';
  isLoading = false;
  showDialog = false;
  contactToEdit: DossierContact | null = null;
  viewedContact: DossierContact | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 6;

  private contactService = inject(DossierContactService);
  private alertService = inject(AlertService);
  private translate = inject(TranslateService);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    if (!this.effectiveDossierId) {
      const routeId = this.route.snapshot.paramMap.get('id') || 
                      this.route.parent?.snapshot.paramMap.get('id');
      if (routeId) {
        this.dossierId = routeId;
      }
    }
    this.loadContacts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dossierID'] || changes['dossierId'] || changes['selectedDossier'] || changes['dossier']) {
      this.currentPage = 1;
      this.loadContacts();
    }
  }

  get effectiveDossierId(): string | number {
    return this.dossierId || 
           this.dossierID || 
           (this.selectedDossier?.id ?? '') || 
           (this.dossier?.id ?? '') || '';
  }

  get effectiveDossierNumber(): string {
    return this.dossierNumber || 
           this.selectedDossier?.referenceInterne || 
           this.dossier?.referenceInterne || '';
  }

  get filteredContacts(): DossierContact[] {
    let result = this.contacts;

    if (this.selectedRoleFilter) {
      result = result.filter(c => (c.notes || '') === this.selectedRoleFilter);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(c => 
        (c.nom && c.nom.toLowerCase().includes(term)) || 
        (c.prenom && c.prenom.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.entreprise && c.entreprise.toLowerCase().includes(term)) ||
        (c.numToque && c.numToque.toLowerCase().includes(term)) ||
        (c.notes && c.notes.toLowerCase().includes(term)) ||
        (c.profession && c.profession.toLowerCase().includes(term)) ||
        (c.pays && c.pays.toLowerCase().includes(term)) ||
        (c.telephoneMobile && c.telephoneMobile.toLowerCase().includes(term)) ||
        (c.telephoneFixe && c.telephoneFixe.toLowerCase().includes(term)) ||
        (c.observation && c.observation.toLowerCase().includes(term))
      );
    }

    return result;
  }

  get uniqueRoles(): string[] {
    const roles = this.contacts
      .map(c => c.notes)
      .filter((r): r is string => !!r && r.trim().length > 0);
    return Array.from(new Set(roles));
  }

  get paginatedContacts(): DossierContact[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredContacts.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredContacts.length / this.pageSize));
  }

  get currentEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredContacts.length);
  }

  onSearchChange() {
    this.currentPage = 1;
  }

  onRoleFilterChange() {
    this.currentPage = 1;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  loadContacts() {
    const id = this.effectiveDossierId;
    if (!id) return;

    this.isLoading = true;
    this.contactService.getByDossierId(id, 0, 1000).subscribe({
      next: (data: PaginatedResponse<DossierContact>) => {
        this.contacts = data.content || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load contacts for matter', err);
        this.isLoading = false;
      }
    });
  }

  openContactDialog(contact?: DossierContact) {
    this.contactToEdit = contact ? { ...contact } : null;
    this.showDialog = true;
  }

  closeContactDialog() {
    this.showDialog = false;
    this.contactToEdit = null;
  }

  saveContact(contact: DossierContact) {
    const isUpdate = !!contact.id;
    const req$ = isUpdate ? this.contactService.update(contact) : this.contactService.create(contact);

    req$.subscribe({
      next: () => {
        this.loadContacts();
        this.closeContactDialog();
        const msgKey = isUpdate ? 'CONTACT.UPDATED_SUCCESS' : 'CONTACT.ADDED_SUCCESS';
        this.alertService.success(this.translate.instant(msgKey));
      },
      error: (err) => {
        console.error('Failed to save contact', err);
        this.alertService.displayMessage('Erreur', 'Impossible d\'enregistrer le contact.', 'error');
      }
    });
  }

  async deleteContact(contact: DossierContact) {
    if (!contact.id) return;

    const title = this.translate.instant('CONTACT.DELETE_CONFIRM_TITLE');
    const msg = this.translate.instant('CONTACT.DELETE_CONFIRM_MSG');

    const confirmed = await this.alertService.confirmMessage(title, msg, 'warning');

    if (confirmed) {
      this.contactService.delete(contact.id).subscribe({
        next: () => {
          this.loadContacts();
          if (this.viewedContact?.id === contact.id) {
            this.closeViewModal();
          }
          this.alertService.success(this.translate.instant('CONTACT.DELETED_SUCCESS'));
        },
        error: (err) => {
          console.error('Failed to delete contact', err);
          this.alertService.displayMessage('Erreur', 'Impossible de supprimer le contact.', 'error');
        }
      });
    }
  }

  viewContactDetails(contact: DossierContact) {
    this.viewedContact = contact;
  }

  closeViewModal() {
    this.viewedContact = null;
  }

  getInitials(contact: DossierContact): string {
    const p = (contact.prenom || '').trim().charAt(0);
    const n = (contact.nom || '').trim().charAt(0);
    const res = `${p}${n}`.toUpperCase();
    return res || 'C';
  }

  getRoleBadgeClass(role?: string): string {
    if (!role) return 'bg-slate-50 text-slate-600 border-slate-200';
    const r = role.toLowerCase();
    if (r.includes('adverse')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (r.includes('expert') || r.includes('tiers')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (r.includes('client')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (r.includes('tribunal') || r.includes('juridiction')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (r.includes('notaire') || r.includes('huissier')) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }
}
