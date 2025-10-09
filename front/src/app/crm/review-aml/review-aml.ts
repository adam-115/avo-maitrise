import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Paths } from '../../paths';

@Component({
  selector: 'app-review-aml',
  imports: [],
  templateUrl: './review-aml.html',
  styleUrl: './review-aml.css'
})
export class ReviewAml {

   constructor(private readonly router: Router) {

  }

  nvigateToClientDetails() {
    this.router.navigate([Paths.HOME, Paths.CLIENT_DETAILS]);
  }

}
