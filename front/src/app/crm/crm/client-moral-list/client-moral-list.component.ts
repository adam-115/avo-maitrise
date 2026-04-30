import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientMoralService } from '../../../services/client-moral.service';
import { ClientMoral } from '../../../appTypes';
import { ClientCardComponent } from '../client-card/client-card.component';
import { PaginatedResponse } from '../../../services/genericService/abstract-crud.service';

@Component({
  selector: 'app-client-moral-list',
  standalone: true,
  imports: [CommonModule, ClientCardComponent],
  templateUrl: './client-moral-list.component.html',
  styleUrl: './client-moral-list.component.css'
})
export class ClientMoralListComponent implements OnInit {
  private service = inject(ClientMoralService);
  clients: ClientMoral[] = [];

  ngOnInit() {
    this.service.getAll().subscribe((data: PaginatedResponse<ClientMoral>) => {
      this.clients = data.content;
    });
  }
}
