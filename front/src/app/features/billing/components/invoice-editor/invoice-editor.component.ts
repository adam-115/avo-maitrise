import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BillingService } from '../../services/billing.service';
import { ClientSelectionDialog } from '../../../../dossier/client-selection-dialog/client-selection-dialog';
import { TaskDetailsDialog } from '../../../../shared/components/task-details-dialog/task-details-dialog';
import { EventDetailsDialog } from '../../../../shared/components/event-details-dialog/event-details-dialog';
import { ClientService } from '../../../../services/client-service';
import { DossierService } from '../../../../services/dossier.service';
import { TaskService } from '../../../../services/task.service';
import { MatterEventService } from '../../../../services/matter-event.service';
import { TaskStatusService } from '../../../../services/task-status.service';
import { TaskCategoryService } from '../../../../services/task-category.service';
import { EventTypeService } from '../../../../services/event-type.service';
import { Client, Dossier, Invoice, InvoiceLineItem, InvoiceStatus, MatterEvent, Task, TaskStatus, TaskCategory, EventType } from '../../../../appTypes';

@Component({
    selector: 'app-invoice-editor',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, ClientSelectionDialog, TaskDetailsDialog, EventDetailsDialog],
    templateUrl: './invoice-editor.component.html'
})
export class InvoiceEditorComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private billingService = inject(BillingService);
    private clientService = inject(ClientService);
    private dossierService = inject(DossierService);
    private taskService = inject(TaskService);
    private eventService = inject(MatterEventService);
    private taskStatusService = inject(TaskStatusService);
    private taskCategoryService = inject(TaskCategoryService);
    private eventTypeService = inject(EventTypeService);

    invoiceId = signal<string | null>(null);

    clients: Client[] = [];
    allDossiers: Dossier[] = [];
    clientDossiers: Dossier[] = [];
    unbilledTasks: Task[] = [];
    unbilledEvents: MatterEvent[] = [];
    taskStatuses: TaskStatus[] = [];
    taskCategories: TaskCategory[] = [];
    eventTypes: EventType[] = [];

    // Track selected items for billing without adding to invoice lines
    selectedTaskIds = new Set<string | number>();
    selectedEventIds = new Set<string | number>();

    // For details modal
    detailTask: Task | null = null;
    detailEvent: MatterEvent | null = null;

    showClientDialog = false;
    showTaskDialog = false;
    showEventDialog = false;

    invoiceForm = new FormGroup({
        invoiceNumber: new FormControl('', Validators.required),
        date: new FormControl<string>(new Date().toISOString().substring(0, 10), Validators.required),
        clientId: new FormControl('', Validators.required),
        clientAddress: new FormControl(''),
        dossierId: new FormControl('', Validators.required),
        status: new FormControl<InvoiceStatus>('DRAFT'),
        lineItems: new FormArray<FormGroup>([]),
        disbursements: new FormControl(0, [Validators.min(0)])
    });

    // Signals réactifs pour les totaux
    totalHT = signal(0);
    totalVAT = signal(0);
    totalTTC = signal(0);

    ngOnInit(): void {
        this.clientService.getAll().subscribe(data => this.clients = data || []);
        this.dossierService.getAll().subscribe(data => this.allDossiers = data || []);
        this.taskStatusService.getAll().subscribe(data => this.taskStatuses = data || []);
        this.taskCategoryService.getAll().subscribe(data => this.taskCategories = data || []);
        this.eventTypeService.getAll().subscribe(data => this.eventTypes = data || []);

        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.invoiceId.set(id);
            this.loadInvoice(id);
        } else {
            // Pré-remplir un numéro brouillon simple
            this.invoiceForm.patchValue({
                invoiceNumber: `FAC-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
            });
            // We don't add an empty line item by default anymore since it makes the form invalid
        }

        // Réagir au changement de client pour filtrer les dossiers
        this.invoiceForm.get('clientId')?.valueChanges.subscribe(clientId => {
            if (clientId) {
                this.clientDossiers = this.allDossiers.filter(d => String(d.clientId) === String(clientId));
                // Reset dossier if not in list
                const currentDossierId = this.invoiceForm.get('dossierId')?.value;
                if (currentDossierId && !this.clientDossiers.find(d => String(d.id) === String(currentDossierId))) {
                    this.invoiceForm.patchValue({ dossierId: '' });
                }
            } else {
                this.clientDossiers = [];
                this.invoiceForm.patchValue({ dossierId: '' });
            }
        });

        // Réagir au changement de dossier pour charger les tâches et événements non facturés
        this.invoiceForm.get('dossierId')?.valueChanges.subscribe(dossierId => {
            if (dossierId) {
                this.loadUnbilledItems(dossierId);
            } else {
                this.unbilledTasks = [];
                this.unbilledEvents = [];
                this.selectedTaskIds.clear();
                this.selectedEventIds.clear();
            }
        });

        // Réagir aux changements du formulaire pour recalculer les totaux
        this.invoiceForm.valueChanges.subscribe(() => {
            this.calculateTotals();
        });
    }

    get lineItemsArr() {
        return this.invoiceForm.get('lineItems') as FormArray;
    }

    addLineItem(item?: Partial<InvoiceLineItem>) {
        const group = new FormGroup({
            description: new FormControl(item?.description || '', Validators.required),
            quantity: new FormControl(item?.quantity || 1, [Validators.required, Validators.min(0.01)]),
            hourlyRate: new FormControl(item?.hourlyRate || 0, [Validators.required, Validators.min(0)]),
            vatRate: new FormControl(item?.vatRate || 20, [Validators.required, Validators.min(0)]),
            relatedTaskId: new FormControl(item?.relatedTaskId || null),
            relatedEventId: new FormControl(item?.relatedEventId || null)
        });
        this.lineItemsArr.push(group);
    }

    removeLineItem(index: number) {
        this.lineItemsArr.removeAt(index);
    }

    calculateTotals() {
        let ht = 0;
        let vat = 0;

        const items = this.lineItemsArr.value as any[];
        items.forEach(item => {
            const q = parseFloat(item.quantity) || 0;
            const rate = parseFloat(item.hourlyRate) || 0;
            const v = parseFloat(item.vatRate) || 0;

            const rowHT = q * rate;
            const rowVAT = rowHT * (v / 100);

            ht += rowHT;
            vat += rowVAT;
        });

        const disbursements = parseFloat(this.invoiceForm.get('disbursements')?.value?.toString() || '0');

        this.totalHT.set(ht);
        this.totalVAT.set(vat);
        this.totalTTC.set(ht + vat + disbursements);
    }

    // Gestion Client
    openClientDialog(): void {
        this.showClientDialog = true;
    }

    closeClientDialog(): void {
        this.showClientDialog = false;
    }

    onClientSelected(clientId: string | number): void {
        this.invoiceForm.patchValue({ clientId: clientId.toString() });
        const client = this.clients.find(c => String(c.id) === String(clientId));
        if (client && client.adresse) {
            this.invoiceForm.patchValue({ clientAddress: client.adresse });
        }
        this.closeClientDialog();
    }

    getSelectedClientName(): string {
        const clientId = this.invoiceForm.get('clientId')?.value;
        if (!clientId) return '';
        const client = this.clients.find(c => String(c.id) === String(clientId));
        return client ? `${client.nom || ''} ${client.prenom || ''}`.trim() : '';
    }

    loadInvoice(id: string) {
        const invoice = this.billingService.invoices().find(i => i.id === id);
        if (invoice) {
            this.invoiceForm.patchValue({
                invoiceNumber: invoice.invoiceNumber,
                date: new Date(invoice.date).toISOString().substring(0, 10),
                clientId: invoice.clientId,
                clientAddress: invoice.clientAddress || '',
                dossierId: invoice.dossierId || '',
                status: invoice.status,
                disbursements: invoice.disbursements
            });
            invoice.lineItems.forEach(li => this.addLineItem(li));
            this.calculateTotals();
        }
    }

    save() {
        if (this.invoiceForm.invalid) {
            console.error('Form is invalid. Errors:');
            Object.keys(this.invoiceForm.controls).forEach(key => {
                const controlErrors = this.invoiceForm.get(key)?.errors;
                if (controlErrors != null) {
                    console.error('Key control: ' + key + ', keyError: ' + JSON.stringify(controlErrors));
                }
            });
            // Also check FormArray
            if (this.lineItemsArr.invalid) {
                console.error('Line items array is invalid');
                this.lineItemsArr.controls.forEach((group: any, index: number) => {
                    Object.keys(group.controls).forEach(key => {
                        const err = group.get(key)?.errors;
                        if (err != null) {
                            console.error(`Line item ${index} - ${key} error: `, err);
                        }
                    });
                });
            }
            this.invoiceForm.markAllAsTouched();
            return;
        }

        const val = this.invoiceForm.value;

        // Mapper les lignes
        const mappedLines: InvoiceLineItem[] = (val.lineItems as any[]).map((li, index) => {
            const totalHT = li.quantity * li.hourlyRate;
            return {
                id: index.toString(),
                description: li.description,
                quantity: li.quantity,
                hourlyRate: li.hourlyRate,
                vatRate: li.vatRate,
                totalHT,
                totalTTC: totalHT * (1 + (li.vatRate / 100)),
                relatedTaskId: li.relatedTaskId,
                relatedEventId: li.relatedEventId
            };
        });

        const newInvoice: Partial<Invoice> = {
            invoiceNumber: val.invoiceNumber!,
            date: new Date(val.date!),
            clientId: val.clientId!,
            clientAddress: val.clientAddress || undefined,
            dossierId: val.dossierId || undefined,
            status: val.status as InvoiceStatus,
            disbursements: val.disbursements || 0,
            lineItems: mappedLines,
            totalHT: this.totalHT(),
            totalVAT: this.totalVAT(),
            totalTTC: this.totalTTC()
        };

        const currentId = this.invoiceId();
        let savedInvoiceId = currentId;

        if (currentId) {
            this.billingService.updateInvoice(currentId, newInvoice);
        } else {
            const added = this.billingService.addInvoice(newInvoice as Invoice);
            // Assuming addInvoice returns the created invoice ideally or we could generate an ID.
            // As a simplified fallback for this sync mock, just use the invoiceNumber
            savedInvoiceId = newInvoice.invoiceNumber || currentId;
        }

        // Marquer les tâches et événements comme facturés
        this.markSelectedItemsAsBilled(savedInvoiceId!);

        this.router.navigate(['/home/billing']);
    }

    // Nouveaux utilitaires pour Dossiers, Tâches, et Événements

    getTaskStatusLabel(statusId: string | number | undefined): string {
        if (!statusId) return '';
        const status = this.taskStatuses.find(s => String(s.id) === String(statusId));
        return status ? status.libelle : '';
    }

    getTaskCategoryLabel(categoryId: number | string | undefined): string {
        if (!categoryId) return '';
        const cat = this.taskCategories.find(c => String(c.id) === String(categoryId));
        return cat ? cat.libelle : '';
    }

    getEventTypeLabel(typeId: number | string | undefined): string {
        if (!typeId) return '';
        const type = this.eventTypes.find(t => String(t.id) === String(typeId));
        return type ? type.label : '';
    }

    formatMinutesToHours(minutes: number): string {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m > 0 ? m + 'm' : ''}`.trim();
    }

    loadUnbilledItems(dossierId: string | number) {
        this.selectedTaskIds.clear();
        this.selectedEventIds.clear();

        this.taskService.getAll().subscribe(tasks => {
            this.unbilledTasks = tasks.filter(t => String(t.dossierId) === String(dossierId) && !t.isBilled);
        });
        this.eventService.getAll().subscribe(events => {
            this.unbilledEvents = events.filter(e => String(e.dossierId) === String(dossierId) && !e.isBilled);
        });
    }

    toggleTaskSelection(taskId: string | number | undefined, event: any) {
        if (!taskId) return;
        if (event.target.checked) {
            this.selectedTaskIds.add(taskId);
        } else {
            this.selectedTaskIds.delete(taskId);
        }
    }

    toggleEventSelection(eventId: string | number | undefined, event: any) {
        if (!eventId) return;
        if (event.target.checked) {
            this.selectedEventIds.add(eventId);
        } else {
            this.selectedEventIds.delete(eventId);
        }
    }

    openTaskDetails(task: Task) {
        this.detailTask = task;
        this.showTaskDialog = true;
    }

    closeTaskDetails() {
        this.detailTask = null;
        this.showTaskDialog = false;
    }

    openEventDetails(event: MatterEvent) {
        this.detailEvent = event;
        this.showEventDialog = true;
    }

    closeEventDetails() {
        this.detailEvent = null;
        this.showEventDialog = false;
    }

    private markSelectedItemsAsBilled(invoiceId: string) {
        this.selectedTaskIds.forEach(taskId => {
            this.taskService.findById(String(taskId)).subscribe(task => {
                if (task) {
                    task.isBilled = true;
                    task.invoiceId = invoiceId;
                    this.taskService.update(String(task.id), task).subscribe();
                }
            });
        });

        this.selectedEventIds.forEach(eventId => {
            this.eventService.findById(String(eventId)).subscribe(evt => {
                if (evt) {
                    evt.isBilled = true;
                    evt.invoiceId = invoiceId;
                    this.eventService.update(String(evt.id), evt).subscribe();
                }
            });
        });
    }
}
