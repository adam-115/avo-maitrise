import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormResultService } from '../../services/form-result-service';
import { FormConfigService } from '../../services/form-config-service';
import { ClientService } from '../../services/client-service';
import { NavigationService } from '../../services/navigation-service';
import { Client, DiligenceFormResult, FieldConfig, FieldResult, FormConfig } from '../../appTypes';
import { ClientStatusAlertComponent } from '../../shared/components/client-status-alert/client-status-alert.component';
import { forkJoin, switchMap, map } from 'rxjs';

@Component({
    selector: 'app-diligence-form-result-viewer',
    standalone: true,
    imports: [CommonModule, TranslatePipe, ClientStatusAlertComponent],
    templateUrl: './diligence-form-result-viewer.component.html',
    styles: [`
        @media print {
            .no-print {
                display: none !important;
            }
            .min-h-screen {
                min-height: auto !important;
                background-color: white !important;
                padding: 0 !important;
            }
            .max-w-5xl {
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .bg-slate-50, .bg-slate-50\\/50 {
                background-color: white !important;
            }
            .shadow-sm, .shadow-md, .shadow-lg {
                box-shadow: none !important;
            }
            .rounded-2xl, .rounded-3xl, .rounded-xl {
                border-radius: 6px !important;
            }
            .border {
                border-color: #cbd5e1 !important;
            }
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
        }
    `]
})
export class DiligenceFormResultViewerComponent implements OnInit {
    result: DiligenceFormResult | null = null;
    formConfig: FormConfig | null = null;
    client: Client | null = null;
    loading = true;
    downloadingPdf = false;

    private route = inject(ActivatedRoute);
    private formResultService = inject(FormResultService);
    private formConfigService = inject(FormConfigService);
    private clientService = inject(ClientService);
    private navigationService = inject(NavigationService);

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.loadData(id);
            } else {
                this.navigationService.navigateToClients();
            }
        });
    }

    private loadData(resultId: string) {
        this.loading = true;
        this.formResultService.findById(resultId).pipe(
            switchMap(result => {
                this.result = result;

                const requests: any = {
                    config: this.formConfigService.findById(result.formConfigId)
                };

                if (result.clientId) {
                    requests.client = this.clientService.findById(result.clientId);
                }

                return forkJoin(requests).pipe(
                    map((response: any) => ({
                        result,
                        config: response.config,
                        client: response.client || null
                    }))
                );
            })
        ).subscribe({
            next: ({ config, client }) => {
                this.formConfig = config;
                this.client = client;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading result data', err);
                this.loading = false;
            }
        });
    }

    printResult() {
        if (!this.result?.id) {
            window.print();
            return;
        }

        this.downloadingPdf = true;
        this.formResultService.generatePdf(this.result.id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Resultat_Formulaire_${this.formConfig?.title || 'Diligence'}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                this.downloadingPdf = false;
            },
            error: (err) => {
                console.error('Error downloading PDF', err);
                this.downloadingPdf = false;
                window.print();
            }
        });
    }

    getDisplayName(client: any): string {
        if (!client) return '';
        return `${client.nom || client.nomCommercial || ''} ${client.prenom || ''}`.trim();
    }

    getClientAddress(client: any): string {
        if (!client) return '';
        const parts = [client.adresse, client.pays || client.paysResidance].filter((p: any) => !!p && String(p).trim() !== '');
        return parts.join(', ');
    }

    isCompany(client: any): boolean {
        if (!client) return false;
        return client.type === 'PERSONNE_MORALE' || client.type === 'COMPANY' || !!client.nomCommercial;
    }

    getClientTypeKey(client: any): string {
        return this.isCompany(client) ? 'FORM_RESULT_VIEWER.TYPE_COMPANY' : 'FORM_RESULT_VIEWER.TYPE_INDIVIDUAL';
    }

    getInitials(client: any): string {
        if (!client) return 'CL';
        const name = this.getDisplayName(client);
        if (!name) return 'CL';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }

    getTotalFieldsCount(): number {
        return this.formConfig?.fields?.length || 0;
    }

    getFilledFieldsCount(): number {
        if (!this.formConfig?.fields || !this.result?.fieldResults) return 0;
        return this.formConfig.fields.filter(f => this.isFieldFilled(f)).length;
    }

    getFilesCount(): number {
        if (!this.formConfig?.fields) return 0;
        return this.formConfig.fields.filter(f => f.type === 'file' && this.hasFile(f)).length;
    }

    isFieldFilled(field: FieldConfig): boolean {
        if (field.type === 'file') return this.hasFile(field);
        if (field.type === 'checkbox') {
            return (field.options || []).some(opt => this.getFieldOptionResult(field.id!, opt.id!));
        }
        const val = this.getFieldResult(field.id!);
        return val !== null && val !== undefined && String(val).trim() !== '' && String(val).trim() !== '-';
    }

    getFieldResult(fieldId: string): any {
        if (!this.result) return null;
        const fieldResult = this.result.fieldResults.find(r => r.fieldConfigId === fieldId);
        return fieldResult ? fieldResult.value : null;
    }

    getFieldResultObj(fieldId: string): FieldResult | null {
        if (!this.result) return null;
        return this.result.fieldResults.find(r => r.fieldConfigId === fieldId) || null;
    }

    getFieldOptionResult(fieldId: string, optionId: string): any {
        if (!this.result) return false;
        const fieldResult = this.result.fieldResults.find(r => r.fieldConfigId === fieldId && r.fieldOptionId === optionId);
        if (!fieldResult) return false;
        if (fieldResult.value === 'true' || fieldResult.value === true) return true;
        if (fieldResult.value === 'false' || fieldResult.value === false) return false;
        return fieldResult.value;
    }

    getFileInfo(field: FieldConfig): { name: string; url?: string; size?: string; ext?: string } | null {
        const resObj = this.getFieldResultObj(field.id!);
        if (!resObj || resObj.value === null || resObj.value === undefined) return null;

        const value = String(resObj.value).trim();
        if (!value || value === '-' || value === 'null' || value === 'undefined') return null;

        // 1. Try JSON parsing (if stored with metadata: { name, data, size, type })
        if (value.startsWith('{') && value.endsWith('}')) {
            try {
                const parsed = JSON.parse(value);
                if (parsed && (parsed.name || parsed.data)) {
                    let formattedSize = '';
                    if (parsed.size) {
                        const kb = parsed.size / 1024;
                        formattedSize = kb >= 1024 ? `${(kb / 1024).toFixed(1)} Mo` : `${Math.round(kb)} Ko`;
                    }
                    const name = parsed.name || 'document_joint';
                    const ext = name.split('.').pop()?.toLowerCase() || '';
                    return {
                        name,
                        url: parsed.data || undefined,
                        size: formattedSize,
                        ext
                    };
                }
            } catch (e) {
                // Not valid JSON, continue
            }
        }

        // 2. Data URL (Base64)
        if (value.startsWith('data:')) {
            const mimeMatch = value.match(/^data:([^;,]+)/);
            const mime = mimeMatch ? mimeMatch[1] : '';
            let ext = 'bin';
            if (mime.includes('pdf')) ext = 'pdf';
            else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
            else if (mime.includes('png')) ext = 'png';
            else if (mime.includes('webp')) ext = 'webp';
            else if (mime.includes('csv')) ext = 'csv';
            else if (mime.includes('text') || mime.includes('plain')) ext = 'txt';

            const baseName = (field.label || 'document')
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9_-]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');

            return {
                name: `${baseName || 'document'}.${ext}`,
                url: value,
                ext
            };
        }

        // 3. File path (e.g., C:\fakepath\carte_identite.png or /uploads/cin.pdf)
        const cleanName = value.split(/[/\\]/).pop() || value;
        const ext = cleanName.split('.').pop()?.toLowerCase() || '';

        return {
            name: cleanName,
            url: (value.startsWith('http://') || value.startsWith('https://')) ? value : undefined,
            ext
        };
    }

    hasFile(field: FieldConfig): boolean {
        return !!this.getFileInfo(field);
    }

    getFileName(field: FieldConfig): string {
        const info = this.getFileInfo(field);
        return info ? info.name : '-';
    }

    getFileSize(field: FieldConfig): string {
        const info = this.getFileInfo(field);
        return info?.size || '';
    }

    getFileExt(field: FieldConfig): string {
        const info = this.getFileInfo(field);
        return info?.ext || 'FILE';
    }

    canDownloadOrPreview(field: FieldConfig): boolean {
        const info = this.getFileInfo(field);
        return !!(info && info.url);
    }

    downloadOrViewFile(field: FieldConfig) {
        const info = this.getFileInfo(field);
        if (!info || !info.url) return;

        if (info.url.startsWith('data:')) {
            const link = document.createElement('a');
            link.href = info.url;
            link.download = info.name || 'document';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (info.url.startsWith('http://') || info.url.startsWith('https://')) {
            window.open(info.url, '_blank');
        }
    }

    getDisplayValue(field: FieldConfig): string {
        if (field.type === 'file') {
            return this.getFileName(field);
        }

        const resObj = this.getFieldResultObj(field.id!);
        if (!resObj) return '-';

        const value = resObj.value;
        const optionId = resObj.fieldOptionId;

        if (value === null || value === undefined || String(value).trim() === '') return '-';

        if (field.type === 'select' || field.type === 'radio') {
            const option = field.options?.find(o => 
                (optionId && o.id === optionId) || 
                o.id === value || 
                o.value === value
            );
            return option ? (option.name || option.value) : value;
        }

        return value;
    }

    goBack() {
        if (this.client) {
            this.navigationService.navigateToClientDiligenceResults(String(this.client.id!));
        } else {
            this.navigationService.navigateToClients();
        }
    }
}
