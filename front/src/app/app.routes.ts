import { Routes } from '@angular/router';
import { Administration } from './administration/administration/administration';
import { ClientType } from './administration/client-type/client-type';
import { Preferences } from './administration/preferences/preferences';
import { ProfileCabinet } from './administration/profile-cabinet/profile-cabinet/profile-cabinet';
import { SecteurActiviteComponent } from './administration/secteur-activite/secteur-activite';
import { Utilisateur } from './administration/utilisateurs/utilisateur/utilisateur';
import { AmlFormConfigComponent } from './aml-compliance/aml-form-config-component/aml-form-config-component';
import { AmlFormListComponent } from './aml-compliance/aml-form-list-component/aml-form-list-component';
import { AmlFormViewComponent } from './aml-compliance/aml-form-view-component/aml-form-view-component';
import { ClientAmlContextComponent } from './aml-compliance/client-aml-context/client-aml-context.component';

// ... existing imports ...

import { Bord } from './Bord/bord/bord';
import { Calendrier } from './calendrier/calendrier/calendrier';
import { ClientDetails } from './crm/client-details/client-details';
import { ClientFormComponent } from './crm/client-form/client-form.component';

import { ClientReviewAmlReport } from './crm/client-review-aml-report/client-review-aml-report';
import { ClientReviewsAml } from './crm/crm/client-reviews-aml/client-reviews-aml';
import { Crm } from './crm/crm/crm';
import { ReviewAml } from './crm/review-aml/review-aml';
import { DossierDetails } from './dossier/dossier-details/dossier-details';
import { DossierForm } from './dossier/dossier-form/dossier-form';
import { Dossier } from './dossier/dossier/dossier';
import { FacturationForm } from './facturation/facturation-form/facturation-form';
import { Facturation } from './facturation/facturation/facturation';
import { Home } from './home/home';
import { Login } from './login/login/login';
import { Model } from './model/model/model';

import { SaisieTemps } from './saisie-temps/saisie-temps/saisie-temps';
import { NavigationService } from './services/navigation-service';
import { Test } from './test/test';
import { ClientAmlReview } from './aml-compliance/client-aml-review/client-aml-review';
import { ClientAmlResult } from './crm/client-aml-result/client-aml-result';
import { DiligenceFormBuilderComponent } from './due-diligence/diligence-form-builder-component/diligence-form-builder-component';
import { DiligenceFormViewerComponent } from './due-diligence/diligence-form-viewer/diligence-form-viewer.component';
import { ClientDiligenceResultsComponent } from './due-diligence/client-diligence-results/client-diligence-results.component';
import { DiligenceFormResultViewerComponent } from './due-diligence/diligence-form-result-viewer/diligence-form-result-viewer.component';

export const routes: Routes = [
  {
    path: '',
    component: Login
  },
  {
    path: NavigationService.HOME,
    component: Home,
    children: [
      {
        path: '',
        component: Bord
      },
      {
        path: NavigationService.DOSSIER,
        component: Dossier
      },
      {
        path: NavigationService.DOSSIER_FORM,
        component: DossierForm
      },
      {
        path: NavigationService.DOSSIER_DETAIL,
        component: DossierDetails
      },
      {
        path: NavigationService.CRM,
        component: Crm,
      },
      {
        path: NavigationService.NEW_CLIENT,
        component: ClientFormComponent,
      },
      {
        path: NavigationService.CLIENT_EDIT,
        component: ClientFormComponent,
      },
      {
        path: NavigationService.CLIENT_DETAILS,
        component: ClientDetails
      },
      {
        // TODO: remove this route
        path: NavigationService.REVIEW_AML,
        component: ReviewAml
      },
      {
        // show all aml reviews for a client
        path: NavigationService.CLIENT_REVIEWS_AML,
        component: ClientReviewsAml
      },
      {
        //TODO remove this one too 
        path: NavigationService.CLIENT_REVIEWS_AML_REPORT,
        component: ClientReviewAmlReport
      },
      // this for review aml for person type contact
      // TODO add the same for societe and institution type contact
      {
        //TODO remove this one too 
        path: NavigationService.PERSON_REVIEW_AML,
        component: ReviewAml
      },
      {
        //TODO remove this one too 
        path: NavigationService.AML_REPORT_PERSON,
        component: ClientReviewAmlReport
      },

      // gestion des documents models
      {
        path: NavigationService.MODEL,
        component: Model

      },

      // gestion de la saisie de temps
      {
        path: NavigationService.SAISIE_TEMPS,
        component: SaisieTemps
      },
      // gestion de la facturation
      {
        path: NavigationService.FACTURATION,
        component: Facturation
      },
      {
        path: NavigationService.FACTURATION_FORM,
        component: FacturationForm
      },
      {
        path: NavigationService.CALENDRIER,
        component: Calendrier
      },
      {
        path: NavigationService.ADMINSTRATION,
        component: Administration
      },
      {
        path: NavigationService.UTILISATEURS,
        component: Utilisateur
      },
      {
        path: NavigationService.PROFILE_CABINET,
        component: ProfileCabinet
      },
      {
        path: NavigationService.ADMIN_PREFERENCE,
        component: Preferences
      },
      {
        path: NavigationService.ADMIN_SECTEUR_ATIVITE,
        component: SecteurActiviteComponent
      },
      {
        path: NavigationService.TYPE_CLIENT,
        component: ClientType
      },
      // AML Compliance Paths can be found in NavigationService
      {
        path: NavigationService.AML_FORM_CONFIG_LIST,
        component: AmlFormListComponent
      },
      {
        path: NavigationService.FORM_CONFIG_CREATE,
        component: AmlFormConfigComponent
      },
      {
        path: NavigationService.FORM_CONFIG_EDIT,
        component: AmlFormConfigComponent
      },
      {
        path: NavigationService.FORM_CONFIG_VIEW,
        component: AmlFormViewComponent
      },
      {
        path: 'client-aml-context/:id',
        component: ClientAmlContextComponent
      },
      {
        path: NavigationService.CLIENT_AML_REVIEW,
        component: ClientAmlReview
      },
      {
        path: NavigationService.CLIENT_AML_RESULT,
        component: ClientAmlResult
      },
      {
        path: NavigationService.DILIGENCE_FORM_BUILDER,
        component: DiligenceFormBuilderComponent
      },
      {
        path: NavigationService.DILIGENCE_FORM_VIEWER,
        component: DiligenceFormViewerComponent
      },
      {
        path: NavigationService.CLIENT_DILIGENCE_RESULTS,
        component: ClientDiligenceResultsComponent
      },
      {
        path: NavigationService.DILIGENCE_FORM_RESULT_VIEWER,
        component: DiligenceFormResultViewerComponent
      }
    ]

  },


  {
    path: 'test',
    component: Test,
  }
];
