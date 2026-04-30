import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InstitutionService } from '../../../services/institution.service';
import { Institution } from '../../../appTypes';
import { ClientCardComponent } from '../client-card/client-card.component';
import { PaginatedResponse } from '../../../services/genericService/abstract-crud.service';

@Component({
  selector: 'app-institution-list',
  standalone: true,
  imports: [CommonModule, ClientCardComponent],
  templateUrl: './institution-list.component.html',
  styleUrl: './institution-list.component.css'
})
export class InstitutionListComponent implements OnInit {
  private service = inject(InstitutionService);
  clients: Institution[] = [];

  ngOnInit() {
    this.service.getAll().subscribe((data: PaginatedResponse<Institution>) => {
      this.clients = data.content;
    });
  }
}
