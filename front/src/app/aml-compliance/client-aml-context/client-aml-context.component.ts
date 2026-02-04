import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MappingFormService } from '../../services/mapping-form-service';
import { AlertService } from '../../services/alert-service';
import { AmlFormViewComponent } from '../aml-form-view-component/aml-form-view-component';

import { SecteurActiviteService } from '../../services/secteur-activite-service';

@Component({
    selector: 'app-client-aml-context',
    standalone: true,
    imports: [CommonModule, AmlFormViewComponent],
    templateUrl: './client-aml-context.component.html',
})
export class ClientAmlContextComponent implements OnInit {

    activatedRoute = inject(ActivatedRoute);
    router = inject(Router);

    mappingFormService = inject(MappingFormService);
    alertService = inject(AlertService);
    secteurService = inject(SecteurActiviteService);

    clientId: string | null = null;
    resolvedFormId: string | number | null = null;
    isLoading = true;
    errorMessage: string | null = null;

    ngOnInit(): void {
        this.activatedRoute.paramMap.subscribe(params => {
            this.clientId = params.get('id');
            if (this.clientId) {
                this.resolveFormForClient(this.clientId);
            } else {
                this.isLoading = false;
                this.errorMessage = "Aucun ID client fourni.";
            }
        });
    }

    private resolveFormForClient(clientId: string) {
        this.isLoading = false;
        this.errorMessage = "Client Service Removed.";
        this.alertService.displayMessage('Erreur', this.errorMessage, 'error');
    }

    private findMapping(client: any) {
        let targetSectorOrType = '';

        if (client.type === 'INSTITUTION') {
            targetSectorOrType = client.typeOrganisme || '';
        } else if (client.type === 'SOCIETE') {
            targetSectorOrType = client.sector || '';
        } else {
            targetSectorOrType = client.sector || '';
        }

        // Fetch both mappings and sectors to resolve potential Code vs Label mismatches
        this.mappingFormService.getAll().subscribe({
            next: (mappings) => {
                this.secteurService.getAll().subscribe(allSectors => {

                    // 1. Try exact match (Label vs Label or Code vs Code)
                    let mapping = mappings.find(m =>
                        m.typeClient === client.type &&
                        m.secteurActivite === targetSectorOrType
                    );

                    // 2. If not found, try to resolve Sector Code from Label
                    if (!mapping) {
                        const matchedSector = allSectors.find(s => s.libelle === targetSectorOrType);
                        if (matchedSector) {
                            mapping = mappings.find(m =>
                                m.typeClient === client.type &&
                                m.secteurActivite === matchedSector.code // Try Code
                            );
                        }
                    }

                    if (mapping) {
                        this.resolvedFormId = mapping.amlFormConfigID;
                    } else {
                        this.errorMessage = `Aucune configuration AML trouvée pour le type ${client.type} / ${targetSectorOrType}.`;
                        this.alertService.displayMessage('Attention', this.errorMessage, 'warning');
                    }
                    this.isLoading = false;
                });
            },
            error: (err) => {
                console.error("Error fetching mappings", err);
                this.isLoading = false;
                this.errorMessage = "Erreur lors de la récupération des configurations.";
            }
        });
    }

    goBack() {
        this.router.navigate(['/home/crm']); // Or strictly back
    }
}
