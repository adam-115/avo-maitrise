import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Dossier, DossierTabType, Client, User } from '../../appTypes';
import { ContactComponent } from "../../contact/contact/contact.component";
import { DocumentComponent } from "../../document/document/document.component";
import { EvenementComponent } from "../../evenement/evenement/evenement.component";
import { NoteComponent } from "../../note/note/note.component";
import { DossierService } from '../../services/dossier.service';
import { ClientService } from '../../services/client-service';
import { UserService } from '../../services/user.service';
import { ClientStatusAlertComponent } from "../../shared/components/client-status-alert/client-status-alert.component";
import { DossierInfo } from "../dossier-info/dossier-info";
import { TaskManagerComponent } from "../task-manager/task-manager.component";

@Component({
  selector: 'app-dossier-details',
  imports: [DocumentComponent, CommonModule, EvenementComponent, TaskManagerComponent, NoteComponent, ContactComponent
    , DossierInfo, ClientStatusAlertComponent, RouterModule],
  templateUrl: './dossier-details.html',
  styleUrl: './dossier-details.css'
})
export class DossierDetails implements OnInit {

  private activatedRoute = inject(ActivatedRoute);
  private dossierService = inject(DossierService);
  private clientService = inject(ClientService);
  private userService = inject(UserService);
  private router = inject(Router);
  userid = "";

  selectedDossier: Dossier | null = null;
  selectedClient: Client | null = null;
  users: User[] = [];


  DossierTabType = DossierTabType;
  selectedTab: DossierTabType = DossierTabType.VUE_ENSEMBLE;
  shwoDocumentDialog = false;

  // Example: You might fetch dossier details here
  dossierDetails: any;

  ngOnInit(): void {
    this.selectedTab = DossierTabType.VUE_ENSEMBLE;
    this.getDossierById();
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getAll().subscribe((data: any) => {
      this.users = data.content || [];
    });
  }

  public getDossierById() {
    this.activatedRoute.params.subscribe((params: any) => {
      this.dossierService.findById(params['id']).subscribe((res: any) => {
        this.selectedDossier = res;
        if (this.selectedDossier?.clientId) {
          this.clientService.findById(this.selectedDossier.clientId).subscribe(client => {
            this.selectedClient = client;
          });
        }
      });
    });
  }

  getResponsable(): User | undefined {
    if (!this.selectedDossier || !this.selectedDossier.responsableId) return undefined;
    return this.users.find(u => String(u.id) === String(this.selectedDossier?.responsableId));
  }

  getIntervenants(): User[] {
    if (!this.selectedDossier || !this.selectedDossier.intervenantsIds) return [];
    const ids = this.selectedDossier.intervenantsIds.map(id => String(id));
    return this.users.filter(u => ids.includes(String(u.id)));
  }



  updateSelectedTab(tab: DossierTabType) {
    this.selectedTab = tab;
  }

  openDocumentDilog() {
    this.shwoDocumentDialog = true;
  }

  closeDocumentDialog() {
    this.shwoDocumentDialog = false;
  }

  getClientStatus(): string | undefined {
    if (!this.selectedClient) return undefined;
    const client = this.selectedClient as any;
    return client.clientStatus || client.status;
  }
}
