import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationService } from '../../services/navigation-service';

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
    this.router.navigate([NavigationService.HOME, NavigationService.CLIENT_DETAILS]);
  }

}
