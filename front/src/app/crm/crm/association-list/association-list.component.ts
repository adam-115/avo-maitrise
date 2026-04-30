import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssociationService } from '../../../services/association.service';
import { Association } from '../../../appTypes';
import { ClientCardComponent } from '../client-card/client-card.component';
import { PaginatedResponse } from '../../../services/genericService/abstract-crud.service';

@Component({
  selector: 'app-association-list',
  standalone: true,
  imports: [CommonModule, ClientCardComponent],
  templateUrl: './association-list.component.html',
  styleUrl: './association-list.component.css'
})
export class AssociationListComponent implements OnInit {
  private service = inject(AssociationService);
  clients: Association[] = [];

  ngOnInit() {
    this.service.getAll().subscribe((data: PaginatedResponse<Association>) => {
      this.clients = data.content;
    });
  }
}
