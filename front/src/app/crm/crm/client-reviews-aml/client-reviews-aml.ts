import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Paths } from '../../../paths';

@Component({
  selector: 'app-client-reviews-aml',
  imports: [],
  templateUrl: './client-reviews-aml.html',
  styleUrl: './client-reviews-aml.css'
})
export class ClientReviewsAml {

  constructor(private readonly router: Router) {
  }

  navigateToReport() {
    this.router.navigate([ Paths.HOME, Paths.CLIENT_REVIEWS_AML_REPORT]);
  }


  navigateToNewReview() {
    this.router.navigate([ Paths.HOME, Paths.REVIEW_AML]);
  }

}
