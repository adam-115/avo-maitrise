import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dossier, User } from '../../appTypes';
import { DossierInfo } from '../dossier-info/dossier-info';

@Component({
  selector: 'app-dossier-vue-ensemble',
  imports: [CommonModule, DossierInfo],
  templateUrl: './dossier-vue-ensemble.html',
  styleUrl: './dossier-vue-ensemble.css'
})
export class DossierVueEnsemble {
  @Input() dossier: Dossier | null = null;
  @Input() users: User[] = [];

  getResponsable(): User | undefined {
    if (!this.dossier || !this.dossier.responsableId) return undefined;
    return this.users.find(u => String(u.id) === String(this.dossier?.responsableId));
  }

  getIntervenants(): User[] {
    if (!this.dossier || !this.dossier.intervenantsIds) return [];
    const ids = this.dossier.intervenantsIds.map(id => String(id));
    return this.users.filter(u => ids.includes(String(u.id)));
  }
}
