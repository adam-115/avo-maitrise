import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Dossier, DossierTabType } from '../../appTypes';
import { ContactComponent } from "../../contact/contact/contact.component";
import { DocumentComponent } from "../../document/document/document.component";
import { EvenementComponent } from "../../evenement/evenement/evenement.component";
import { NoteComponent } from "../../note/note/note.component";
import { DossierService } from '../../services/dossier.service';
import { DossierInfo } from "../dossier-info/dossier-info";
import { TaskManagerComponent } from "../task-manager/task-manager.component";

@Component({
  selector: 'app-dossier-details',
  imports: [DocumentComponent, CommonModule, EvenementComponent, TaskManagerComponent, NoteComponent, ContactComponent, DossierInfo],
  templateUrl: './dossier-details.html',
  styleUrl: './dossier-details.css'
})
export class DossierDetails implements OnInit {

  private activatedRoute = inject(ActivatedRoute);
  private dossierService = inject(DossierService);
  private router = inject(Router);
  userid = "";

  selectedDossier: Dossier | null = null;


  DossierTabType = DossierTabType;
  selectedTab: DossierTabType = DossierTabType.VUE_ENSEMBLE;
  shwoDocumentDialog = false;

  // Example: You might fetch dossier details here
  dossierDetails: any;

  ngOnInit(): void {
    this.selectedTab = DossierTabType.VUE_ENSEMBLE;
    this.getDossierById();
  }

  public getDossierById() {
    this.activatedRoute.params.subscribe((params: any) => {
      this.dossierService.findById(params['id']).subscribe((res: any) => {
        this.selectedDossier = res;
        console.log("selectedDossier", this.selectedDossier);

      });
    });
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
}
