import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationService } from '../../../services/navigation-service';

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
    this.router.navigate([NavigationService.HOME, NavigationService.CLIENT_REVIEWS_AML_REPORT]);
  }


  navigateToNewReview() {
    this.router.navigate([NavigationService.HOME, NavigationService.REVIEW_AML]);
  }

}
