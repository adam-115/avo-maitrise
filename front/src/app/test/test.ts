import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TypeClient } from '../appTypes';
import { Contact } from "../contact/contact/contact";


@Component({
  selector: 'app-test',
  imports: [CommonModule, FormsModule, ReactiveFormsModule,
    RouterModule, Contact],
  templateUrl: './test.html',
  styleUrl: './test.css'
})
export class Test {
  navigateBackToAdmin() {

  }

  navigateToClientTypes() {

  }


}
