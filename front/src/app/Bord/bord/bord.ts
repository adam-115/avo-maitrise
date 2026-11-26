import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { ClientService } from '../../services/client-service';
import { DossierService } from '../../services/dossier.service';
import { AppointementService } from '../../services/appointement.service';
import { TaskService } from '../../services/task.service';
import { NavigationService } from '../../services/navigation-service';
import { Notification, Client, Dossier, Appointement, Task } from '../../appTypes';
import { KeycloakService } from '../../services/keycloak.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-bord',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './bord.html',
  styleUrl: './bord.css'
})
export class Bord implements OnInit {
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly clientService = inject(ClientService);
  private readonly dossierService = inject(DossierService);
  private readonly appointementService = inject(AppointementService);
  private readonly taskService = inject(TaskService);
  private readonly navigationService = inject(NavigationService);
  private readonly keycloakService = inject(KeycloakService);

  // States
  username = '';
  notifications: Notification[] = [];
  recentDossiers: Dossier[] = [];
  upcomingAppointments: Appointement[] = [];
  pendingTasks: Task[] = [];

  // Metrics
  totalClientsCount = 0;
  totalDossiersCount = 0;
  totalTasksCount = 0;
  totalAppointmentsCount = 0;

  isLoading = true;
  showAllNotifications = false;

  get displayedNotifications(): Notification[] {
    if (this.showAllNotifications || this.notifications.length <= 3) {
      return this.notifications;
    }
    return this.notifications.slice(0, 3);
  }

  toggleShowAllNotifications(): void {
    this.showAllNotifications = !this.showAllNotifications;
  }

  markAllNotificationsAsRead(): void {
    if (this.notifications.length === 0) return;
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications = [];
      },
      error: (err) => {
        console.error('Error marking all notifications as read', err);
        // Fallback: sequentially mark
        const ids = this.notifications.map(n => n.id).filter((id): id is number => typeof id === 'number');
        ids.forEach(id => this.notificationService.markAsRead(id).subscribe());
        this.notifications = [];
      }
    });
  }

  navigateToAmlHub(): void {
    this.router.navigate(['/home/aml-compliance']);
  }

  ngOnInit(): void {
    this.username = this.keycloakService.getUsername() || '';
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;

    // Fetch unread AML monitoring notifications
    this.notificationService.getUnread().subscribe({
      next: (data) => {
        this.notifications = data || [];
      },
      error: (err) => console.error('Error fetching notifications', err)
    });

    // Fetch total clients
    this.clientService.getAll().subscribe({
      next: (res) => {
        this.totalClientsCount = res ? res.totalElements : 0;
      },
      error: (err) => console.error('Error fetching clients count', err)
    });

    // Fetch recent dossiers
    this.dossierService.getAll().subscribe({
      next: (res) => {
        if (res) {
          this.totalDossiersCount = res.totalElements;
          this.recentDossiers = res.content ? res.content.slice(0, 4) : [];
        }
      },
      error: (err) => console.error('Error fetching dossiers', err)
    });

    // Fetch upcoming appointments
    this.appointementService.getAll().subscribe({
      next: (res) => {
        if (res) {
          this.totalAppointmentsCount = res.totalElements;
          this.upcomingAppointments = res.content ? res.content.slice(0, 4) : [];
        }
      },
      error: (err) => console.error('Error fetching appointments', err)
    });

    // Fetch pending tasks
    this.taskService.getAll().subscribe({
      next: (res) => {
        if (res) {
          this.totalTasksCount = res.totalElements;
          this.pendingTasks = res.content ? res.content.filter(t => !t.isCompleted).slice(0, 4) : [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching tasks', err);
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

  completeTask(task: Task): void {
    if (task.id) {
      const updatedTask = { ...task, isCompleted: true };
      this.taskService.update(updatedTask).subscribe({
        next: () => {
          this.pendingTasks = this.pendingTasks.filter(t => t.id !== task.id);
          this.totalTasksCount = Math.max(0, this.totalTasksCount - 1);
        },
        error: (err) => console.error('Error completing task', err)
      });
    }
  }

  // Navigation Helpers
  navigateToClientDetails(id: string | number): void {
    this.navigationService.navigateToClientDetails(id.toString());
  }

  navigateToClientConformity(id: string | number): void {
    if (id) {
      this.navigationService.navigateToClientConformity(id.toString());
    }
  }

  navigateToDossierDetails(id: string | number): void {
    this.navigationService.navigateToDossierDetails(id.toString());
  }

  navigateToNewClient(): void {
    this.navigationService.navigateToNewClient();
  }

  navigateToNewDossier(): void {
    this.router.navigate(['/home/dossier-form']);
  }

  navigateToCalendar(): void {
    this.router.navigate(['/home/calendrier']);
  }

  navigateToClients(): void {
    this.navigationService.navigateToClients();
  }

  navigateToDossiers(): void {
    this.router.navigate(['/home/dossier']);
  }
}
