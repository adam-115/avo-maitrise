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
