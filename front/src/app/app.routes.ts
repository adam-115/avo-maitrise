import { FacturationForm } from './facturation/facturation-form/facturation-form';
import { ReviewAml } from './crm/review-aml/review-aml';
import { Routes } from '@angular/router';
import { Dossier } from './dossier/dossier/dossier';
import { Paths } from './paths';
import { Home } from './home/home';
import { Test } from './test/test';
import { DossierForm } from './dossier/dossier-form/dossier-form';
import { DossierDetails } from './dossier/dossier-details/dossier-details';
import { CalendrierDossier } from './calendrier/calendrier-dossier/calendrier-dossier';
import { Crm } from './crm/crm/crm';
import { ClientForm } from './crm/client-form/client-form';
import { ClientDetails } from './crm/client-details/client-details';
import { ClientReviewsAml } from './crm/crm/client-reviews-aml/client-reviews-aml';
import { ClientReviewAmlReport } from './crm/client-review-aml-report/client-review-aml-report';
import { Model } from './model/model/model';
import { SaisieTemps } from './saisie-temps/saisie-temps/saisie-temps';
import { Facturation } from './facturation/facturation/facturation';

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

      {
        path: Paths.CRM,
        component: Crm,
      },
      {
        path: Paths.CLIENT_FORM,
        component: ClientForm
      },
      {
        path: Paths.CLIENT_DETAILS,
        component:ClientDetails
      },
      {
        path: Paths.REVIEW_AML,
        component: ReviewAml
      },
      {
        path: Paths.CLIENT_REVIEWS_AML,
        component: ClientReviewsAml
      },
      {
        path: Paths.CLIENT_REVIEWS_AML_REPORT,
        component: ClientReviewAmlReport
      },
      // this for review aml for person type contact
      // TODO add the same for societe and institution type contact
      {
        path: Paths.PERSON_REVIEW_AML,
        component: ReviewAml
      },
      {
       path: Paths.AML_REPORT_PERSON,
       component: ClientReviewAmlReport
      },

      // gestion des documents models
      {
        path: Paths.MODEL,
        component: Model

      },

      // gestion de la saisie de temps
      {
        path: Paths.SAISIE_TEMPS,
        component: SaisieTemps
      },
      // gestion de la facturation
      {
        path: Paths.FACTURATION,
        component: Facturation
      },
      {
        path: Paths.FACTURATION_FORM,
        component: FacturationForm
      },
      {
        path:Paths.CALENDRIER_DOSSIER,
        component: CalendrierDossier
      }

    ]
  },


  {
    path: 'test',
    component: Test,
  }
];
