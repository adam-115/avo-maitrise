import { Component, OnInit, inject } from '@angular/core';
import { AmlFormResult, AmlFormConfig } from '../../appTypes';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

import { AmlFormResultService } from '../../services/aml-form-result-result-service';
import { AmlFormConfigService } from '../../services/AmlFormConfigService';

@Component({
  selector: 'app-client-details',
  imports: [CommonModule],
  templateUrl: './client-details.html',
  styleUrl: './client-details.css'
})
export class ClientDetails implements OnInit {

  client: any | null = null;
  amlResults: AmlFormResult[] = [];
  documents: { label: string, filename: string, date: Date }[] = [];

  isLoading = true;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly amlFormResultService = inject(AmlFormResultService);
  private readonly amlFormConfigService = inject(AmlFormConfigService);

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

  loadClient(id: string) {
    this.isLoading = false;
    // ClientService removed
  }

  loadAmlResults(clientId: string) {
    this.amlFormResultService.getAll().subscribe(results => {
      // Filter by clientId (be careful with string/number types)
      this.amlResults = results.filter(r => r.clientId?.toString() === clientId.toString());

      this.extractDocuments();

      this.isLoading = false;
    });
  }

  extractDocuments() {
    this.documents = [];

    // For each result, looking for values that look like files OR fetching config to be sure
    // For now, simple heuristic: if value ends with typical extension, it's a doc.
    // Ideally we should match with InputConfig type = 'uploadFile'.

    this.amlResults.forEach(result => {
      if (result.AmlPageConfigValues) {
        result.AmlPageConfigValues.forEach(val => {
          if (this.isFile(val.value)) {
            // Try to find a label (we might need to fetch the config for this, but for now generic label or look up in cache)
            this.documents.push({
              label: 'Document justificatif', // We could improve this by fetching the config
              filename: val.value,
              date: new Date() // We don't have date in AmlInputValue, maybe add it to AmlFormResult?
            });
          }
        });
      }
    });

    // Better: Fetch form configs to get labels
    this.enrichDocumentsMetadata();
  }

  isFile(value: string): boolean {
    if (!value) return false;
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
              const doc = this.documents.find(d => d.filename === val.value);
              if (doc) doc.label = inputConfig.labelMessage;
              else if (val.value) {
                // If heuristic missed it (e.g. no extension)
                this.documents.push({
                  label: inputConfig.labelMessage,
                  filename: val.value,
                  date: new Date()
                });
              }
            }
          });
        });
      });
    });
  }

  startComplianceReview() {
    this.router.navigate(['home', 'client-aml-context', this.client?.id]);
  }

  editClient() {
    console.log('Edit client', this.client?.id);
  }
}
