import { Component, OnInit } from '@angular/core';
import { DossierTabType } from '../../appTypes';
import { Document } from "../../document/document/document";
import { CommonModule } from '@angular/common';
import { Evenement } from "../../evenement/evenement/evenement";
import { Tache } from "../../tache/tache/tache";
import { Note } from "../../note/note/note";
import { Contact } from "../../contact/contact/contact";
import { Temp } from "../../temp/temp/temp";
import { DossierFacture } from "../dossier-facture/dossier-facture";

@Component({
  selector: 'app-dossier-details',
  imports: [Document, CommonModule, Evenement, Tache, Note, Contact, Temp, DossierFacture],
  templateUrl: './dossier-details.html',
  styleUrl: './dossier-details.css'
})
export class DossierDetails implements OnInit {
  DossierTabType = DossierTabType;
  selectedTab: DossierTabType = DossierTabType.VUE_ENSEMBLE;

  // Example: You might fetch dossier details here
  dossierDetails: any;

  ngOnInit(): void {
    this.selectedTab = DossierTabType.VUE_ENSEMBLE;

  }

  updateSelectedTab(tab: DossierTabType) {
    this.selectedTab = tab;
  }
}
