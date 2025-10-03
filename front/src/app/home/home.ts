import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Dossier } from "../dossier/dossier/dossier";

@Component({
  selector: 'app-home',
  imports: [RouterOutlet, Dossier],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

}
