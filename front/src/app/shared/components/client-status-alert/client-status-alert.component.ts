import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientStatus } from '../../../appTypes';

@Component({
  selector: 'app-client-status-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="status && status !== 'VALIDATED'" class="flex items-start gap-3 p-3 mt-3 border rounded-lg bg-amber-50 border-amber-200 shadow-sm animate-fade-in-down">
      <div class="flex-shrink-0 mt-0.5">
        <span class="relative flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
        </span>
      </div>
      
      <div class="flex-1">
        <p class="text-sm text-amber-800">
          <span class="font-semibold text-amber-900">Attention :</span> Le statut actuel de ce client est 
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900 mx-1 border border-amber-200">
            {{ formatStatus(status) }}
          </span>.
        </p>
        <p class="text-xs text-amber-700 mt-1">
          Assurez-vous que le dossier de conformité (AML) est complété.
        </p>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeInDown {
      0% { opacity: 0; transform: translateY(-10px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-down {
      animation: fadeInDown 0.3s ease-out forwards;
    }
  `]
})
export class ClientStatusAlertComponent {
  @Input() status?: ClientStatus | string;

  formatStatus(statusStr: string): string {
    return statusStr.replace(/_/g, ' ');
  }
}
