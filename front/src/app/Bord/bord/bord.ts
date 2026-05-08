import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { ScreeningMatchService } from '../../services/screening-match.service';
import { Notification, ScreeningMatchDTO } from '../../appTypes';
import { NavigationService } from '../../services/navigation-service';

@Component({
  selector: 'app-bord',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bord.html',
  styleUrl: './bord.css'
})
export class Bord implements OnInit {
  private notificationService = inject(NotificationService);
  private screeningMatchService = inject(ScreeningMatchService);
  private navigationService = inject(NavigationService);

  notifications: Notification[] = [];
  reEvaluationMatches: ScreeningMatchDTO[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    
    // Fetch unread monitoring notifications
    this.notificationService.getUnread().subscribe({
      next: (data) => {
        this.notifications = data;
      },
      error: (err) => console.error('Error fetching notifications', err)
    });

    // Fetch matches requiring re-evaluation (latest 5)
    this.screeningMatchService.getByClientId('', 0, 5, 'createdAt,desc').subscribe({
        // Note: the backend search might need a specific filter for status
        // I'll add a specific method to ScreeningMatchService if needed, 
        // but for now I'll use the generic search with status param in the service.
    });
    
    // Better way: use a specific search in the service
    this.loadReEvaluations();
  }

  loadReEvaluations(): void {
    this.screeningMatchService.getReEvaluationMatches(0, 5).subscribe({
      next: (res) => {
        this.reEvaluationMatches = res.content || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching re-evaluations', err);
        this.isLoading = false;
      }
    });
  }

  markAsRead(notif: Notification): void {
    if (notif.id) {
      this.notificationService.markAsRead(notif.id).subscribe(() => {
        this.notifications = this.notifications.filter(n => n.id !== notif.id);
      });
    }
  }

  navigateToClientDetails(id: string|number)  {
    this.navigationService.navigateToClientDetails(id.toString());
  }


}
