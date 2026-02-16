
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../services/navigation-service';
import { FormConfig } from '../../appTypes';
import { FormConfigService } from '../../services/form-config-service';
import { AlertService } from '../../services/alert-service';

@Component({
    selector: 'app-diligence-form-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './diligence-form-list.component.html',
    styleUrl: './diligence-form-list.component.css',
})
export class DiligenceFormListComponent implements OnInit {
    formConfigService = inject(FormConfigService);
    navigationService = inject(NavigationService);
    alertService = inject(AlertService);

    formConfigs: FormConfig[] = [];

    ngOnInit(): void {
        this.loadFormsConfig();
    }

    loadFormsConfig(): void {
        this.formConfigService.getAll().subscribe({
            next: (data) => {
                this.formConfigs = data;
            },
            error: (err) => {
                this.alertService.displayMessage('Erreur', 'Impossible de charger les formulaires', 'error');
                console.error('Error loading forms', err);
            }
        });
    }

    onAdd(): void {
        this.navigationService.navigateToDiligenceFormBuilder();
    }

    onEdit(id: string): void {
        // Assuming the builder can handle edit mode via query param or route param. 
        // The current builder seems to generate a new ID on init, so it might need adjustment for edit mode.
        // For now, I'll navigate to the builder.
        // Checking NavigationService for proper edit method.
        // NavigationService has navigateToDiligenceFormBuilder() which creates new.
        // I need to check if there is an edit route or if I should pass an ID.
        // NavigationService.DILIGENCE_FORM_BUILDER is "diligence-form-builder/:id".
        // So I should pass the ID.
        this.navigationService.navigateToDiligenceFormBuilderEdit(id);
    }

    onDelete(id: string): void {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce formulaire ?')) {
            this.formConfigService.delete(id).subscribe({
                next: () => {
                    this.alertService.displayMessage('Succès', 'Formulaire supprimé', 'success');
                    this.loadFormsConfig();
                },
                error: (err) => {
                    this.alertService.displayMessage('Erreur', 'Impossible de supprimer le formulaire', 'error');
                    console.error('Error deleting form', err);
                }
            });
        }
    }

    onView(id: string): void {
        // Navigate to viewer (preview)
        this.navigationService.navigateToDiligenceFormViewer(id);
    }
}
