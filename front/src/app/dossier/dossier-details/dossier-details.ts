import { Component, inject, OnInit } from '@angular/core';
import { DossierTabType } from '../../appTypes';
import { DocumentComponent } from "../../document/document/document.component";
import { CommonModule } from '@angular/common';
import { Evenement } from "../../evenement/evenement/evenement";
import { TaskManagerComponent } from "../task-manager/task-manager.component";
import { NoteComponent } from "../../note/note/note.component";
import { Contact } from "../../contact/contact/contact";
import { Temp } from "../../temp/temp/temp";
import { DossierFacture } from "../dossier-facture/dossier-facture";
import { ActivatedRoute, Router } from '@angular/router';
import { DossierService } from '../../services/dossier.service';
import { Dossier } from '../../appTypes';
import { DossierInfo } from "../dossier-info/dossier-info";

@Component({
  selector: 'app-dossier-details',
  imports: [DocumentComponent, CommonModule, Evenement, TaskManagerComponent, NoteComponent, Contact, Temp, DossierFacture, DossierInfo],
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
