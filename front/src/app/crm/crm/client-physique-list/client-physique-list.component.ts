import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonnePhysiqueService } from '../../../services/personne-physique.service';
import { ClientPersonnePhysique } from '../../../appTypes';
import { ClientCardComponent } from '../client-card/client-card.component';
import { PaginatedResponse } from '../../../services/genericService/abstract-crud.service';

@Component({
  selector: 'app-client-physique-list',
  standalone: true,
  imports: [CommonModule, ClientCardComponent],
  templateUrl: './client-physique-list.component.html',
  styleUrl: './client-physique-list.component.css'
})
export class ClientPhysiqueListComponent implements OnInit {
  private service = inject(PersonnePhysiqueService);
  clients: ClientPersonnePhysique[] = [];

  ngOnInit() {
    this.service.getAll().subscribe((data: PaginatedResponse<ClientPersonnePhysique>) => {
      this.clients = data.content;
    });
  }
}
