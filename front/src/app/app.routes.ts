import { Routes } from '@angular/router';
import { Dossier } from './dossier/dossier/dossier';
import { Paths } from './paths';
import { Home } from './home/home';
import { Test } from './test/test';
import { DossierForm } from './dossier/dossier-form/dossier-form';
import { DossierDetails } from './dossier/dossier-details/dossier-details';
import { CalendrierDossier } from './calendrier/calendrier-dossier/calendrier-dossier';

export const routes: Routes = [
  {
    path: Paths.HOME,
    component: Home,
    children: [
      {
        path: Paths.DOSSIER,
        component: Dossier
      },
      {
        path: Paths.DOSSIER_FORM,
        component: DossierForm
      },
      {
        path: Paths.DOSSIER_DETAIL,
        component: DossierDetails
      },
      {
        path: 'dossier/calendrier',
        component: CalendrierDossier
      },
    ]
  },


  {
    path: 'test',
    component: Test,
  }
];
