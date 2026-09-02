import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillingDashboardService, UnbilledDossierSummary } from '../../services/billing-dashboard.service';
import { CabinetProfileService } from '../../../../services/cabinet-profile.service';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

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

    cabinetCurrency = signal<string>('€');
    cabinetTvaRate = signal<number>(20);

    isLoading = signal<boolean>(true);

    startDate = signal<string>('');
    endDate = signal<string>('');

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
        this.loadDashboardData();
    }

    resetFilters(): void {
        this.startDate.set('');
        this.endDate.set('');
        this.loadDashboardData();
    }

    private loadDashboardData() {
        this.isLoading.set(true);
        
        // Parallel requests using forkJoin would be better, but doing it sequentially or independent for now is fine since they return observables. Let's just subscribe to both independently to keep it simple.
        this.dashboardService.getActiveClientsCount().subscribe({
            next: (res) => {
                this.activeClientsCount.set(res.count);
            },
            error: (err) => console.error(err)
        });

        this.dashboardService.getActiveDossiersCount().subscribe({
            next: (res) => {
                this.activeDossiersCount.set(res.count);
            },
            error: (err) => console.error(err)
        });

        this.dashboardService.getUnbilledMinutes(this.startDate() || undefined, this.endDate() || undefined).subscribe({
            next: (res) => {
                this.unbilledMinutes.set(res.count);
            },
            error: (err) => console.error(err)
        });

        this.dashboardService.getUnbilledAmounts(this.startDate() || undefined, this.endDate() || undefined).subscribe({
            next: (res) => {
                this.unbilledAmountHT.set(res.ht);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error(err);
            }
        });

        this.dashboardService.getBilledMinutes(this.startDate() || undefined, this.endDate() || undefined).subscribe({
            next: (res) => {
                this.billedMinutes.set(res.count);
            },
            error: (err) => console.error(err)
        });

        this.dashboardService.getBilledAmounts(this.startDate() || undefined, this.endDate() || undefined).subscribe({
            next: (res) => {
                this.billedAmountHT.set(res.ht);
            },
            error: (err) => console.error(err)
        });

        this.dashboardService.getPendingMinutes(this.startDate() || undefined, this.endDate() || undefined).subscribe({
            next: (res) => {
                this.pendingMinutes.set(res.count);
            },
            error: (err) => console.error(err)
        });

        this.dashboardService.getPendingAmounts(this.startDate() || undefined, this.endDate() || undefined).subscribe({
            next: (res) => {
                this.pendingAmountHT.set(res.ht);
            },
            error: (err) => console.error(err)
        });

        this.dashboardService.getCancelledMinutes(this.startDate() || undefined, this.endDate() || undefined).subscribe({
            next: (res) => {
                this.cancelledMinutes.set(res.count);
            },
            error: (err) => console.error(err)
        });

        this.dashboardService.getCancelledAmounts(this.startDate() || undefined, this.endDate() || undefined).subscribe({
            next: (res) => {
                this.cancelledAmountHT.set(res.ht);
            },
            error: (err) => console.error(err)
        });

        this.dashboardService.getUnbilledByDossier(this.startDate() || undefined, this.endDate() || undefined).subscribe({
            next: (res) => {
                this.unbilledDossiers.set(res);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error(err);
                this.isLoading.set(false);
            }
        });
    }
}
