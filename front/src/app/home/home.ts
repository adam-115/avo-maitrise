import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Paths } from '../paths';

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

  navigateTOClients() {
    this.router.navigateByUrl(Paths.HOME + '/' + Paths.CRM);
  }

}
