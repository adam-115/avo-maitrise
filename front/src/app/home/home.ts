import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterOutlet],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

  constructor(private readonly router: Router) {

  }

  navigateTODossier() {
    this.router.navigateByUrl('/home/dossier');
  }

}
