import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TypeClient } from '../appTypes';
import { ContactComponent } from "../contact/contact/contact.component";


@Component({
  selector: 'app-test',
  imports: [CommonModule, FormsModule, ReactiveFormsModule,
    RouterModule],
  templateUrl: './test.html',
  styleUrl: './test.css'
})
export class Test {
  navigateBackToAdmin() {

  }

  navigateToClientTypes() {

  }


}
