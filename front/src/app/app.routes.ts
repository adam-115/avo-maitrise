import { Routes } from '@angular/router';
import { Dossier } from './dossier/dossier/dossier';
import { Paths } from './paths';
import { Home } from './home/home';

export const routes: Routes = [
  {
    path: Paths.HOME,
    component:Home,
    children: [
      {
        path: Paths.DOSSIER,
        component: Dossier
      }
    ]
  }
];
