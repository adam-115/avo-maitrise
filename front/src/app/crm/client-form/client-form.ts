import { Component } from '@angular/core';
import { ClientType } from '../../appTypes';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-client-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './client-form.html',
  styleUrl: './client-form.css'
})
export class ClientForm {

  clientType = ClientType;
  clientTypes = Object.values(ClientType);
  selectedClientType: ClientType = ClientType.PESONNE;
}
