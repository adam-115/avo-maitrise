import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AlertService } from '../../services/alert-service';
import { MappingFormService } from '../../services/mapping-form-service';
import { AmlFormViewComponent } from '../aml-form-view-component/aml-form-view-component';

import { AmlFormConfig, Client, ClientStatus, MappingForm } from '../../appTypes';
import { ClientService } from '../../services/client-service';
import { SecteurActiviteService } from '../../services/secteur-activite-service';

@Component({
    selector: 'app-client-aml-context',
    standalone: true,
    imports: [CommonModule, AmlFormViewComponent],
    templateUrl: './client-aml-context.component.html',
})
export class ClientAmlContextComponent implements OnInit {

    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly router = inject(Router);


    private readonly clientService = inject(ClientService);
    private readonly mappingFormService = inject(MappingFormService);
    private readonly alertService = inject(AlertService);
    private readonly secteurService = inject(SecteurActiviteService);

    clientId: string | null = null;
    selectedClient: Client | null = null;
    resolvedFormId: string | number | null = null;
    isLoading = true;
    errorMessage: string | null = null;

    ngOnInit(): void {
        this.activatedRoute.paramMap.subscribe(params => {
            this.clientId = params.get('id');
            if (this.clientId) {
                this.loadClientByID(this.clientId);
            } else {
                this.isLoading = false;
                this.errorMessage = "Aucun ID client fourni.";
            }
        });
    }

    private loadClientByID(clientId: string) {
        this.clientService.findById(clientId).subscribe({
            next: (client: Client) => {
                if (client.clientStatus != ClientStatus.AML_REQUIRED) {
                    this.alertService.displayMessage('Attention', 'Le client n\'a pas besoin de formulaire AML.', 'warning');
                    this.router.navigate(['/home/crm']);
                    return;
                }
                this.isLoading = false;
                this.selectedClient = client;
                this.clientId = clientId;
                this.loadClientAmlFormsConfig();
                console.log(clientId);
                console.log(this.resolvedFormId);


            },
            error: (err) => {
                console.error("Error fetching client", err);
                this.isLoading = false;
                this.errorMessage = "Erreur lors de la récupération du client.";
            }
        });
    }


    private loadClientAmlFormsConfig() {
        this.mappingFormService.findMappingByClientTypeAndSector(this.selectedClient?.type!, this.selectedClient?.secteurActivite!).subscribe({
            next: (amlFormConfigs: AmlFormConfig[]) => {
                this.isLoading = false;
                console.log(amlFormConfigs);
                this.resolvedFormId = amlFormConfigs[0].id ?? null;
                console.log(this.resolvedFormId);
            },
            error: (err) => {
                console.error("Error fetching amlFormConfigs", err);
                this.isLoading = false;
                this.errorMessage = "Erreur lors de la récupération des configurations AML.";
            }
        })
    }





    // private findMapping(client: any) {
    //     let targetSectorOrType = '';

    //     if (client.type === 'INSTITUTION') {
    //         targetSectorOrType = client.typeOrganisme || '';
    //     } else if (client.type === 'SOCIETE') {
    //         targetSectorOrType = client.sector || '';
    //     } else {
    //         targetSectorOrType = client.sector || '';
    //     }

    //     // Fetch both mappings and sectors to resolve potential Code vs Label mismatches
    //     this.mappingFormService.getAll().subscribe({
    //         next: (mappings) => {
    //             this.secteurService.getAll().subscribe(allSectors => {

    //                 // 1. Try exact match (Label vs Label or Code vs Code)
    //                 let mapping = mappings.find(m =>
    //                     m.typeClient === client.type &&
    //                     m.secteurActivite === targetSectorOrType
    //                 );

    //                 // 2. If not found, try to resolve Sector Code from Label
    //                 if (!mapping) {
    //                     const matchedSector = allSectors.find(s => s.libelle === targetSectorOrType);
    //                     if (matchedSector) {
    //                         mapping = mappings.find(m =>
    //                             m.typeClient === client.type &&
    //                             m.secteurActivite === matchedSector.code // Try Code
    //                         );
    //                     }
    //                 }

    //                 if (mapping) {
    //                     this.resolvedFormId = mapping.amlFormConfigID;
    //                 } else {
    //                     this.errorMessage = `Aucune configuration AML trouvée pour le type ${client.type} / ${targetSectorOrType}.`;
    //                     this.alertService.displayMessage('Attention', this.errorMessage, 'warning');
    //                 }
    //                 this.isLoading = false;
    //             });
    //         },
    //         error: (err) => {
    //             console.error("Error fetching mappings", err);
    //             this.isLoading = false;
    //             this.errorMessage = "Erreur lors de la récupération des configurations.";
    //         }
    //     });
    // }

    goBack() {
        alert("back");
        this.router.navigate(['/crm']); // Or strictly back
    }
}
