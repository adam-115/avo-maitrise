import { Component, OnInit, inject } from '@angular/core';
import { AmlFormResult, AmlFormConfig, Document, Client, ClientStatus } from '../../appTypes';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

import { AmlFormResultService } from '../../services/aml-form-result-result-service';
import { AmlFormConfigService } from '../../services/AmlFormConfigService';
import { ClientService } from '../../services/client-service';
import { NavigationService } from '../../services/navigation-service';
import { AlertService } from '../../services/alert-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-client-details',
  imports: [CommonModule, FormsModule],
  templateUrl: './client-details.html',
  styleUrl: './client-details.css'
})
export class ClientDetails implements OnInit {

  clientService = inject(ClientService);
  client: Client | null = null;
  amlResults: AmlFormResult[] = [];
  // documents: Document[] = [];

  isLoading = true;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly navigationService = inject(NavigationService);
  private readonly alertService = inject(AlertService);

  private readonly amlFormResultService = inject(AmlFormResultService);
  private readonly amlFormConfigService = inject(AmlFormConfigService);

  // Expose ClientStatus enum for the template
  public ClientStatus = ClientStatus;
  // Get all values from the enum
  public clientStatuses = Object.values(ClientStatus);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadClient(id);
      } else {
        this.isLoading = false;
      }
    });
  }

  private loadClient(id: string) {
    this.clientService.findById(id).subscribe(client => {
      this.client = client;
      this.loadAmlResults(id);
    });
  }

  private loadAmlResults(clientId: string) {
    this.amlFormResultService.getAll().subscribe(results => {
      // Filter by clientId (be careful with string/number types)
      this.amlResults = results.filter(r => r.clientId?.toString() === clientId.toString());

      this.extractDocuments();

      this.isLoading = false;
    });
  }

  private extractDocuments() {
    // Map existing client documents if they exist
    if (this.client && this.client.documents) {
      this.client.documents = this.client.documents.map((d: any) => ({
        label: d.title || 'Document Client',
        filename: d.name || d.filename || 'unknown',
        date: new Date() // Date handling could be improved if API provides it
      }));
    } else if (this.client) {
      this.client.documents = [];
    }

    // For each result, looking for values that look like files OR fetching config to be sure
    // For now, simple heuristic: if value ends with typical extension, it's a doc.
    // Ideally we should match with InputConfig type = 'uploadFile'.

    this.amlResults.forEach(result => {
      if (result.AmlPageConfigValues) {
        result.AmlPageConfigValues.forEach(val => {
          if (this.isFile(val.value)) {
            // Try to find a label (we might need to fetch the config for this, but for now generic label or look up in cache)
            if (this.client) {
              this.client.documents = this.client.documents || [];
              this.client.documents.push({
                label: 'Document justificatif', // We could improve this by fetching the config
                filename: val.value,
                date: new Date() // We don't have date in AmlInputValue, maybe add it to AmlFormResult?
              });
            }
          }
        });
      }
    });

    // Better: Fetch form configs to get labels
    this.enrichDocumentsMetadata();
  }

  isFile(value: string): boolean {
    if (!value) return false; // Ensure value is not null/undefined
    const extensions = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.csv'];
    return extensions.some(ext => value.toLowerCase().endsWith(ext));
  }

  enrichDocumentsMetadata() {
    // Get unique Config IDs
    const configIds = [...new Set(this.amlResults.map(r => r.amlFormConfigID).filter(id => !!id))];

    configIds.forEach(configId => {
      this.amlFormConfigService.findById(configId).subscribe(config => {
        // Update documents with correct labels
        this.amlResults.filter(r => r.amlFormConfigID == configId).forEach(result => {
          result.AmlPageConfigValues?.forEach(val => {
            const inputConfig = config.inputConfigs.find(ic => ic.id === val.InputConfigID);
            if (inputConfig && inputConfig.type === 'uploadFile') {
              // Find the document in our list and update label
              // Find the document in our list and update label
              if (this.client && this.client.documents) {
                const doc = this.client.documents.find(d => d.filename === val.value);
                if (doc) doc.label = inputConfig.labelMessage;
                else if (val.value) {
                  // If heuristic missed it (e.g. no extension or logic missed it)
                  this.client.documents.push({
                    label: inputConfig.labelMessage,
                    filename: val.value,
                    date: new Date()
                  });
                }
              }
            }
          });
        });
      });
    });
  }

  startAmlReview() {
    this.navigationService.navigateToClientAMLReview(this.client?.id!);
  }

  editClient() {
    console.log('Edit client', this.client?.id);
    this.navigationService.navigateToClientEdit(String(this.client?.id));
  }

  downloadDocument(doc: Document) {
    console.log("doc.file" + doc.file);

    if (doc.file) {
      const url = URL.createObjectURL(doc.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.filename || doc.name || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      console.log('Download document', doc);
    }
  }

  async onStatusChange(newStatus: string) {
    if (!this.client) return;

    const previousStatus = this.client.clientStatus;
    // If undefined/null, previousStatus might be undefined, handle gracefully logic if needed

    const confirmed = await this.alertService.confirmMessage(
      'Confirmation de changement de statut',
      `Êtes-vous sûr de vouloir changer le statut du client de "${previousStatus}" vers "${newStatus}" ?`,
      'warning'
    );

    if (confirmed) {
      this.clientService.updateClientStatus(this.client.id!, newStatus as ClientStatus).subscribe({
        next: (updatedClient) => {
          this.client = updatedClient;
          this.alertService.success('Statut du client mis à jour avec succès');
        },
        error: (err) => {
          console.error('Error updating status', err);
          this.alertService.displayMessage('Erreur', 'Impossible de mettre à jour le statut.', 'error');
          // Revert on error
          if (this.client) this.client.clientStatus = previousStatus;
        }
      });
    } else {
      // Revert change if cancelled (because ngModel updated it essentially)
      // Actually with (ngModelChange) the model is updated unless we split binding. 
      // But here I'll use simple (change) on select and [ngModel] without () maybe?
      // Or just revert:
      this.client.clientStatus = previousStatus;
      // Force angular detection or reload? Since it's primitive string, it should work if UI bound.
      // However, often select needs a tick to revert visually if we prevent the change. 
      // Let's rely on standard revert.

      // Creating a new reference to trigger change detection if needed, or just assigning back.
      // If using [(ngModel)], the value in UI corresponds to `client.clientStatus`.
      // When user selects new item, `client.clientStatus` Becomes `newStatus`.
      // Then we enter this function. `previousStatus` we can't get from `this.client.clientStatus` anymore since it's already updated!
      // WAIT. The logic above "const previousStatus = this.client.clientStatus" gets the NEW status if [(ngModel)] updated it already.

      // CORRECT APPROACH: Split [(ngModel)] into [ngModel] and (ngModelChange).
      // OR store previous status somewhere? No.
      // I'll use (change) event on the select and manually handle the update logic instead of two-way binding for the confirmation flow.
      // But wait, `(change)` passes the event.
    }
  }

  // Better approach for confirmation flow:
  // We use [ngModel]="client.clientStatus" (one way)
  // And (ngModelChange)="onStatusChange($event)"
  // In onStatusChange(newVal), `this.client.clientStatus` is STILL the OLD value because we didn't use [()]. 
  // We only update it if confirmed.

  async handleStatusChange(newStatus: any) {
    if (!this.client) return;
    const currentStatus = this.client.clientStatus;

    if (newStatus === currentStatus) return;

    const confirmed = await this.alertService.confirmMessage(
      'Changement de statut',
      `Voulez-vous passer ce dossier au statut : ${newStatus} ?`,
      'question'
    );

    if (confirmed) {
      this.clientService.updateClientStatus(this.client.id!, newStatus).subscribe({
        next: (updated) => {
          this.client = updated;
          this.alertService.success('Statut mis à jour.');
        },
        error: (err) => {
          console.error(err);
          this.alertService.displayMessage('Erreur', 'Echec de la mise à jour', 'error');
        }
      });
    } else {
      // Since we verify before applying, we don't need to revert the model technically,
      // BUT the UI select might have visually changed to the selected option even if we didn't update the model?
      // No, with [ngModel] (one-way), if we don't update the variable, Angular should keep/revert the select to the bound value.
      // Sometimes strictly need to force update to same value to trigger change detection if it got out of sync.
      // A simple trick is `this.client.clientStatus = currentStatus` (reassign self)
      const temp = this.client.clientStatus;
      this.client.clientStatus = undefined; // Hack to force change detection
      setTimeout(() => { if (this.client) this.client.clientStatus = temp; }, 0);
    }
  }
}


