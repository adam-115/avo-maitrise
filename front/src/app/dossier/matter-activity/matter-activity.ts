import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { MatterActivity } from '../../appTypes';
import { MatterActivityService } from '../../services/matter-activity.service';

@Component({
  selector: 'app-matter-activity',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, TranslateDirective],
  templateUrl: './matter-activity.html'
})
export class MatterActivityComponent implements OnInit {
  @Input() dossierId!: number | string;

  private activityService = inject(MatterActivityService);

  activities: MatterActivity[] = [];
  protected Math = Math;
  
  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  // Filters
  startDate: string = '';
  endDate: string = '';

  ngOnInit(): void {
    this.loadActivities();
  }

  loadActivities(): void {
    // Convert dates to ISO format if present
    const start = this.startDate ? new Date(this.startDate).toISOString() : undefined;
    const end = this.endDate ? new Date(this.endDate).toISOString() : undefined;

    // Use a search endpoint that supports pagination and dates
    // For now, I'll update the service to support this or call the new search endpoint
    this.activityService.searchActivities(this.dossierId, start, end, this.currentPage, this.pageSize)
      .subscribe((res: any) => {
        this.activities = res.content;
        this.totalElements = res.totalElements;
        this.totalPages = res.totalPages;
      });
  }

  onFilter(): void {
    this.currentPage = 0;
    this.loadActivities();
  }

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadActivities();
    }
  }

  getTargetIcon(type: string): string {
    switch (type?.toUpperCase()) {
      case 'DOSSIER': return 'folder';
      case 'NOTE': return 'sticky-note';
      case 'TASK': return 'check-circle';
      case 'DOCUMENT': return 'file-text';
      case 'CONTACT': return 'users';
      case 'EVENT': return 'calendar';
      default: return 'activity';
    }
  }
}
