import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillingDashboardService, UnbilledDossierSummary } from '../../services/billing-dashboard.service';
import { CabinetProfileService } from '../../../../services/cabinet-profile.service';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
    selector: 'app-billing-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, TranslatePipe],
    templateUrl: './billing-dashboard.component.html'
})
export class BillingDashboardComponent implements OnInit {
    private readonly dashboardService = inject(BillingDashboardService);
    private readonly cabinetProfileService = inject(CabinetProfileService);

    unbilledDossiers = signal<UnbilledDossierSummary[]>([]);
    searchTerm = signal<string>('');

    filteredUnbilledDossiers = computed(() => {
        const query = this.searchTerm().toLowerCase().trim();
        const list = this.unbilledDossiers();
        if (!query) return list;
        return list.filter(d => 
            (d.dossierTitre && d.dossierTitre.toLowerCase().includes(query)) ||
            (d.referenceInterne && d.referenceInterne.toLowerCase().includes(query)) ||
            (d.clientName && d.clientName.toLowerCase().includes(query))
        );
    });

    activeClientsCount = signal<number>(0);
    activeDossiersCount = signal<number>(0);
    unbilledMinutes = signal<number>(0);
    unbilledAmountHT = signal<number>(0);
    unbilledAmountTTC = computed(() => this.unbilledAmountHT() * (1 + this.cabinetTvaRate() / 100));
    
    billedMinutes = signal<number>(0);
    billedAmountHT = signal<number>(0);
    billedAmountTTC = computed(() => this.billedAmountHT() * (1 + this.cabinetTvaRate() / 100));

    pendingMinutes = signal<number>(0);
    pendingAmountHT = signal<number>(0);
    pendingAmountTTC = computed(() => this.pendingAmountHT() * (1 + this.cabinetTvaRate() / 100));

    cancelledMinutes = signal<number>(0);
    cancelledAmountHT = signal<number>(0);
    cancelledAmountTTC = computed(() => this.cancelledAmountHT() * (1 + this.cabinetTvaRate() / 100));

    totalRevenueHT = computed(() => this.unbilledAmountHT() + this.pendingAmountHT() + this.billedAmountHT());
    
    billedRatio = computed(() => {
        const total = this.totalRevenueHT();
        return total > 0 ? Math.round((this.billedAmountHT() / total) * 100) : 0;
    });

    pendingRatio = computed(() => {
        const total = this.totalRevenueHT();
        return total > 0 ? Math.round((this.pendingAmountHT() / total) * 100) : 0;
    });

    unbilledRatio = computed(() => {
        const total = this.totalRevenueHT();
        if (total === 0) return 0;
        const remaining = 100 - this.billedRatio() - this.pendingRatio();
        return Math.max(0, remaining);
    });

    cabinetCurrency = signal<string>('€');
    cabinetTvaRate = signal<number>(20);

    isLoading = signal<boolean>(true);

    startDate = signal<string>('');
    endDate = signal<string>('');
    activePreset = signal<string>('ALL');

    get isFiltered(): boolean {
        return !!(this.startDate() || this.endDate());
    }

    getClientInitial(clientName: string | undefined): string {
        if (!clientName) return 'CL';
        return clientName.trim().charAt(0).toUpperCase();
    }

    formatMinutes(minutes: number): string {
        if (!minutes || minutes <= 0) return '0 min';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins} min`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins < 10 ? '0' : ''}${mins}m`;
    }

    ngOnInit(): void {
        this.loadProfile();
        this.loadDashboardData();
    }

    private loadProfile(): void {
        this.cabinetProfileService.getProfile().subscribe({
            next: (profile) => {
                if (profile) {
                    if (profile.currency) {
                        const symbol = this.getCurrencySymbol(profile.currency);
                        this.cabinetCurrency.set(symbol);
                    }
                    if (profile.tvaRate !== undefined && profile.tvaRate !== null) {
                        this.cabinetTvaRate.set(profile.tvaRate);
                    }
                }
            },
            error: (err) => console.error('Error loading cabinet profile', err)
        });
    }

    private getCurrencySymbol(currencyCode: string): string {
        switch(currencyCode) {
            case 'EUR': return '€';
            case 'USD': return '$';
            case 'MAD': return 'MAD';
            case 'CHF': return 'CHF';
            default: return currencyCode;
        }
    }

    onFilterChange(): void {
        this.activePreset.set('CUSTOM');
        this.loadDashboardData();
    }

    resetFilters(): void {
        this.activePreset.set('ALL');
        this.startDate.set('');
        this.endDate.set('');
        this.loadDashboardData();
    }

    setPeriodPreset(preset: 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER' | 'THIS_YEAR' | 'ALL'): void {
        this.activePreset.set(preset);
        const now = new Date();
        const pad = (n: number) => n < 10 ? `0${n}` : `${n}`;

        if (preset === 'ALL') {
            this.startDate.set('');
            this.endDate.set('');
        } else if (preset === 'THIS_MONTH') {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            this.startDate.set(`${firstDay.getFullYear()}-${pad(firstDay.getMonth() + 1)}-01`);
            this.endDate.set(`${lastDay.getFullYear()}-${pad(lastDay.getMonth() + 1)}-${pad(lastDay.getDate())}`);
        } else if (preset === 'LAST_MONTH') {
            const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
            this.startDate.set(`${firstDay.getFullYear()}-${pad(firstDay.getMonth() + 1)}-01`);
            this.endDate.set(`${lastDay.getFullYear()}-${pad(lastDay.getMonth() + 1)}-${pad(lastDay.getDate())}`);
        } else if (preset === 'THIS_QUARTER') {
            const quarter = Math.floor(now.getMonth() / 3);
            const firstDay = new Date(now.getFullYear(), quarter * 3, 1);
            const lastDay = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
            this.startDate.set(`${firstDay.getFullYear()}-${pad(firstDay.getMonth() + 1)}-01`);
            this.endDate.set(`${lastDay.getFullYear()}-${pad(lastDay.getMonth() + 1)}-${pad(lastDay.getDate())}`);
        } else if (preset === 'THIS_YEAR') {
            this.startDate.set(`${now.getFullYear()}-01-01`);
            this.endDate.set(`${now.getFullYear()}-12-31`);
        }

        this.loadDashboardData();
    }

    private loadDashboardData() {
        this.isLoading.set(true);
        const sDate = this.startDate() || undefined;
        const eDate = this.endDate() || undefined;

        forkJoin({
            clients: this.dashboardService.getActiveClientsCount().pipe(catchError(() => of({ count: 0 }))),
            dossiers: this.dashboardService.getActiveDossiersCount().pipe(catchError(() => of({ count: 0 }))),
            unbilledMin: this.dashboardService.getUnbilledMinutes(sDate, eDate).pipe(catchError(() => of({ count: 0 }))),
            unbilledAmt: this.dashboardService.getUnbilledAmounts(sDate, eDate).pipe(catchError(() => of({ ht: 0 }))),
            billedMin: this.dashboardService.getBilledMinutes(sDate, eDate).pipe(catchError(() => of({ count: 0 }))),
            billedAmt: this.dashboardService.getBilledAmounts(sDate, eDate).pipe(catchError(() => of({ ht: 0 }))),
            pendingMin: this.dashboardService.getPendingMinutes(sDate, eDate).pipe(catchError(() => of({ count: 0 }))),
            pendingAmt: this.dashboardService.getPendingAmounts(sDate, eDate).pipe(catchError(() => of({ ht: 0 }))),
            cancelledMin: this.dashboardService.getCancelledMinutes(sDate, eDate).pipe(catchError(() => of({ count: 0 }))),
            cancelledAmt: this.dashboardService.getCancelledAmounts(sDate, eDate).pipe(catchError(() => of({ ht: 0 }))),
            unbilledByDossier: this.dashboardService.getUnbilledByDossier(sDate, eDate).pipe(catchError(() => of([])))
        }).subscribe({
            next: (res) => {
                this.activeClientsCount.set(res.clients.count);
                this.activeDossiersCount.set(res.dossiers.count);
                this.unbilledMinutes.set(res.unbilledMin.count);
                this.unbilledAmountHT.set(res.unbilledAmt.ht);
                this.billedMinutes.set(res.billedMin.count);
                this.billedAmountHT.set(res.billedAmt.ht);
                this.pendingMinutes.set(res.pendingMin.count);
                this.pendingAmountHT.set(res.pendingAmt.ht);
                this.cancelledMinutes.set(res.cancelledMin.count);
                this.cancelledAmountHT.set(res.cancelledAmt.ht);
                this.unbilledDossiers.set(res.unbilledByDossier);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading dashboard data', err);
                this.isLoading.set(false);
            }
        });
    }
}
