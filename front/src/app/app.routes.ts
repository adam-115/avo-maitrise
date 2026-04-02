import { Routes } from '@angular/router';

// ... existing imports ...



import { NavigationService } from './services/navigation-service';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./login/login/login').then(m => m.Login)
  },
  {
    path: NavigationService.HOME,
    loadComponent: () => import('./home/home').then(m => m.Home),
    children: [
      {
        path: '',
        loadComponent: () => import('./Bord/bord/bord').then(m => m.Bord)
      },
      {
        path: NavigationService.DOSSIER,
        loadComponent: () => import('./dossier/dossier/dossier.component').then(m => m.DossierComponent)
      },
      {
        path: NavigationService.DOSSIER_FORM,
        loadComponent: () => import('./dossier/dossier-form/dossier-form').then(m => m.DossierForm)
      },
      {
        path: NavigationService.DOSSIER_DETAIL,
        loadComponent: () => import('./dossier/dossier-details/dossier-details').then(m => m.DossierDetails)
      },
      {
        path: NavigationService.CRM,
        loadComponent: () => import('./crm/crm/crm').then(m => m.Crm),
      },
      {
        path: NavigationService.NEW_CLIENT,
        loadComponent: () => import('./crm/client-form/client-form.component').then(m => m.ClientFormComponent),
      },
      {
        path: NavigationService.CLIENT_EDIT,
        loadComponent: () => import('./crm/client-form/client-form.component').then(m => m.ClientFormComponent),
      },
      {
        path: NavigationService.CLIENT_DETAILS,
        loadComponent: () => import('./crm/client-details/client-details').then(m => m.ClientDetails)
      },
      {
        path: NavigationService.CLIENT_REVIEWS_AML,
        loadComponent: () => import('./crm/crm/client-reviews-aml/client-reviews-aml').then(m => m.ClientReviewsAml)
      },

      // gestion des documents models
      {
        path: NavigationService.MODEL,
        loadComponent: () => import('./model/model/model').then(m => m.Model)

      },

      // gestion de la facturation
      {
        path: NavigationService.CALENDRIER,
        loadComponent: () => import('./calendrier/calendrier/calendrier').then(m => m.Calendrier)
      },
      {
        path: NavigationService.ADMINSTRATION,
        loadComponent: () => import('./administration/administration/administration').then(m => m.Administration)
      },
      {
        path: NavigationService.UTILISATEURS,
        loadComponent: () => import('./administration/utilisateurs/utilisateur/utilisateur').then(m => m.Utilisateur)
      },
      {
        path: NavigationService.PROFILE_CABINET,
        loadComponent: () => import('./administration/profile-cabinet/profile-cabinet/profile-cabinet').then(m => m.ProfileCabinet)
      },
      {
        path: NavigationService.ADMIN_PREFERENCE,
        loadComponent: () => import('./administration/preferences/preferences').then(m => m.Preferences)
      },
      {
        path: NavigationService.ADMIN_SECTEUR_ATIVITE,
        loadComponent: () => import('./administration/secteur-activite/secteur-activite').then(m => m.SecteurActiviteComponent)
      },
      {
        path: NavigationService.TYPE_CLIENT,
        loadComponent: () => import('./administration/client-type/client-type').then(m => m.ClientType)
      },
      // AML Compliance Paths can be found in NavigationService
      {
        path: NavigationService.AML_FORM_CONFIG_LIST,
        loadComponent: () => import('./aml-compliance/aml-form-list-component/aml-form-list-component').then(m => m.AmlFormListComponent)
      },
      {
        path: NavigationService.FORM_CONFIG_CREATE,
        loadComponent: () => import('./aml-compliance/aml-form-config-component/aml-form-config-component').then(m => m.AmlFormConfigComponent)
      },
      {
        path: NavigationService.FORM_CONFIG_EDIT,
        loadComponent: () => import('./aml-compliance/aml-form-config-component/aml-form-config-component').then(m => m.AmlFormConfigComponent)
      },
      {
        path: NavigationService.FORM_CONFIG_VIEW,
        loadComponent: () => import('./aml-compliance/aml-form-view-component/aml-form-view-component').then(m => m.AmlFormViewComponent)
      },
      // {
      //   path: 'client-aml-context/:id',
      //   component: ClientAmlContextComponent
      // },
      {
        path: NavigationService.CLIENT_AML_REVIEW,
        loadComponent: () => import('./aml-compliance/client-aml-review/client-aml-review').then(m => m.ClientAmlReview)
      },
      {
        path: NavigationService.CLIENT_AML_RESULT,
        loadComponent: () => import('./crm/client-aml-result/client-aml-result').then(m => m.ClientAmlResult)
      },
      {
        path: NavigationService.DILIGENCE_FORM_BUILDER,
        loadComponent: () => import('./due-diligence/diligence-form-builder-component/diligence-form-builder-component').then(m => m.DiligenceFormBuilderComponent)
      },
      {
        path: NavigationService.DILIGENCE_FORM_BUILDER_EDIT,
        loadComponent: () => import('./due-diligence/diligence-form-builder-component/diligence-form-builder-component').then(m => m.DiligenceFormBuilderComponent)
      },
      {
        path: NavigationService.DILIGENCE_FORM_VIEWER,
        loadComponent: () => import('./due-diligence/diligence-form-viewer/diligence-form-viewer.component').then(m => m.DiligenceFormViewerComponent)
      },
      {
        path: NavigationService.CLIENT_DILIGENCE_RESULTS,
        loadComponent: () => import('./due-diligence/client-diligence-results/client-diligence-results.component').then(m => m.ClientDiligenceResultsComponent)
      },

      {
        path: NavigationService.DILIGENCE_FORM_RESULT_VIEWER,
        loadComponent: () => import('./due-diligence/diligence-form-result-viewer/diligence-form-result-viewer.component').then(m => m.DiligenceFormResultViewerComponent)
      },
      {
        path: NavigationService.DILIGENCE_FORM_LIST,
        loadComponent: () => import('./due-diligence/diligence-form-list/diligence-form-list.component').then(m => m.DiligenceFormListComponent)
      },
      {
        path: NavigationService.DOSSIER_STATUS_FORM,
        loadComponent: () => import('./administration/dossier-status-form/dossier-status-form.component').then(m => m.DossierStatusFormComponent)
      },
      {
        path: NavigationService.DOSSIER_PRIORITE,
        loadComponent: () => import('./administration/dossier-priorite/dossier-priorite.component').then(m => m.DossierPrioriteComponent)
      },
      {
        path: NavigationService.DOMAINE_JURIDIQUE,
        loadComponent: () => import('./administration/domaine-juridique-form/domaine-juridique-form.component').then(m => m.DomaineJuridiqueFormComponent)
      },
      {
        path: NavigationService.TASK_CATEGORY,
        loadComponent: () => import('./administration/task-category-form/task-category-form.component').then(m => m.TaskCategoryFormComponent)
      },
      {
        path: NavigationService.TASK_STATUS,
        loadComponent: () => import('./administration/task-status-form/task-status-form.component').then(m => m.TaskStatusFormComponent)
      },
      {
        path: NavigationService.NOTE_CATEGORY,
        loadComponent: () => import('./administration/note-category/note-category.component').then(m => m.NoteCategoryComponent)
      },
      {
        path: NavigationService.EVENT_TYPE,
        loadComponent: () => import('./administration/event-type/event-type.component').then(m => m.EventTypeComponent)
      },
      // Routes Nouveau Module Facturation
      {
        path: NavigationService.BILLING,
        loadComponent: () => import('./features/billing/components/invoice-list/invoice-list.component').then(m => m.InvoiceListComponent)
      },
      {
        path: NavigationService.BILLING_EDITOR,
        loadComponent: () => import('./features/billing/components/invoice-editor/invoice-editor.component').then(m => m.InvoiceEditorComponent)
      },
      {
        path: NavigationService.BILLING_EDITOR_EDIT,
        loadComponent: () => import('./features/billing/components/invoice-editor/invoice-editor.component').then(m => m.InvoiceEditorComponent)
      },
      {
        path: NavigationService.BILLING_PREVIEW,
        loadComponent: () => import('./features/billing/components/invoice-preview/invoice-preview.component').then(m => m.InvoicePreviewComponent)
      },
      {
        path: 'test',
        loadComponent: () => import('./test/test').then(m => m.Test),
      }
    ]

  },

];
