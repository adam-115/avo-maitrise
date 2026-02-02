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
import { Bord } from './Bord/bord/bord';
import { Calendrier } from './calendrier/calendrier/calendrier';
import { ClientDetails } from './crm/client-details/client-details';
import { ClientForm } from './crm/client-form/client-form';
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
import { Paths } from './paths';
import { SaisieTemps } from './saisie-temps/saisie-temps/saisie-temps';
import { NavigationService } from './services/navigation-service';
import { Test } from './test/test';

export const routes: Routes = [
  {
    path: '',
    component: Login
  },
  {
    path: Paths.HOME,
    component: Home,
    children: [
      {
        path: '',
        component: Bord
      },
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
        path: Paths.CRM,
        component: Crm,
      },
      {
        path: Paths.CLIENT_FORM,
        component: ClientForm
      },
      {
        path: Paths.CLIENT_DETAILS,
        component: ClientDetails
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
        path: Paths.CALENDRIER,
        component: Calendrier
      },
      {
        path: Paths.ADMINSTRATION,
        component: Administration
      },
      {
        path: Paths.UTILISATEURS,
        component: Utilisateur
      },
      {
        path: Paths.PROFILE_CABINET,
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
    ]
  },


  {
    path: 'test',
    component: Test,
  }
];
