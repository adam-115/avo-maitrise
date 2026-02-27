import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SecteurActivite } from '../appTypes';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {

  private readonly router = inject(Router);

  // AML Compliance Navigation
  // Constants migrated from Paths
  static readonly LOGIN = 'login';
  static readonly HOME = 'home';
  static readonly DOSSIER = 'dossier';
  static readonly DOSSIER_FORM = 'dossier-form';
  static readonly DOSSIER_DETAIL = 'dossier-detail/:id';
  static readonly CRM = 'crm';
  static readonly NEW_CLIENT = 'crm/client/new';
  static readonly CLIENT_EDIT = 'crm/client/edit/:id';

  static readonly CLIENT_DETAILS = 'client-details';
  static readonly CLIENT_REVIEWS_AML = 'client-reviews-aml';
  static readonly REVIEW_AML = 'review-aml';
  static readonly CLIENT_REVIEWS_AML_REPORT = 'client-reviews-aml-report';
  static readonly PERSON_REVIEW_AML = 'person-new-review-aml';
  static readonly AML_REPORT_PERSON = 'aml-report-person';
  static readonly MODEL = 'model';
  static readonly SAISIE_TEMPS = 'saisie-temps';
  static readonly FACTURATION = 'facturation';
  static readonly FACTURATION_FORM = 'facturation-form';
  static readonly FACTURATION_DETAIL = 'facturation-detail';
  static readonly CALENDRIER = 'calendrier';
  static readonly ADMINSTRATION = 'administration';
  static readonly UTILISATEURS = 'utilisateurs';
  static readonly PROFILE_CABINET = 'profile-cabinet';
  static readonly AML_COMPLIANCE = 'aml-compliance';

  // AML Compliance Navigation
  public static readonly AML_FORM_CONFIG_LIST = "aml-form-config-list";
  public static readonly FORM_CONFIG_CREATE = "form-config/create";
  public static readonly FORM_CONFIG_EDIT = "form-config/edit/:id";
  public static readonly FORM_CONFIG_VIEW = "form-config/view/:id";
  public static readonly FORM_RESULT_VIEW = "form-result/view/:id";
  public static readonly CLIENT_AML_CONTEXT = "client-aml-context/:id";
  public static readonly TYPE_CLIENT = "type_client";
  public static readonly ADMIN_PREFERENCE = "admin_preference";
  public static readonly ADMIN_SECTEUR_ATIVITE = "admin_secteur_activite";
  public static readonly CLIENT_AML_REVIEW = "client-aml-review/:id";

  //Aml & dueDiligence
  public static readonly CLIENT_AML_RESULT = "client-aml-result/:id";
  public static readonly DILIGENCE_FORM_BUILDER = "diligence-form-builder";
  public static readonly DILIGENCE_FORM_BUILDER_EDIT = "diligence-form-builder/:id";
  public static readonly DILIGENCE_FORM_VIEWER = "diligence-form-viewer/:id";
  public static readonly CLIENT_DILIGENCE_RESULTS = "client-diligence-results/:id";
  public static readonly DILIGENCE_FORM_RESULT_VIEWER = "diligence-form-result-viewer/:id";
  public static readonly DILIGENCE_FORM_LIST = "diligence-form-list";

  //statut de dossier preference 
  public static readonly DOSSIER_STATUS_FORM = "dossier-status-form";
  public static readonly DOSSIER_PRIORITE = "dossier-priorite";
  public static readonly DOMAINE_JURIDIQUE = "domaine-juridique";
  public static readonly TASK_CATEGORY = "task-category";
  public static readonly TASK_STATUS = "task-status";
  public static readonly NOTE_CATEGORY = "note-category";



  public navigateToFormConfigList(): void {
    this.router.navigate(['/home/', NavigationService.AML_FORM_CONFIG_LIST]);
  }

  public navigateToNewFormConfig(): void {
    this.router.navigate(['/home/', ...NavigationService.FORM_CONFIG_CREATE.split('/')]);
  }


  public navigateToEditFormConfig(id: number): void {
    let targetUrl = NavigationService.FORM_CONFIG_EDIT.replace(":id", id.toString());
    this.router.navigate(['/home/', ...targetUrl.split("/")]);

  }

  public navigateToViewFormConfig(id: number, queryParams?: any): void {
    let targetUrl = NavigationService.FORM_CONFIG_VIEW.replace(":id", id.toString());
    this.router.navigate(['/home/', ...targetUrl.split("/")], { queryParams: queryParams });
  }

  public navigateToAMLContext(clientId: string): void {
    let targetUrl = NavigationService.CLIENT_AML_CONTEXT.replace(":id", clientId);
    this.router.navigate(['/home/', ...targetUrl.split("/")]);
  }



  public navigateToTypeClient(): void {
    this.router.navigate(['/home/', ...NavigationService.TYPE_CLIENT.split('/')]);
  }


  navigateToClients(): void {
    this.router.navigateByUrl(NavigationService.HOME + '/' + NavigationService.CRM);
  }


  navigateToAdminPrefences() {
    this.router.navigate([NavigationService.HOME, NavigationService.ADMIN_PREFERENCE]);
  }

  navigateToPrefrenceTypeClient() {
    this.router.navigate([NavigationService.HOME, NavigationService.TYPE_CLIENT]);
  }

  navigateToAdminSecteurActivite() {
    this.router.navigate([NavigationService.HOME, NavigationService.ADMIN_SECTEUR_ATIVITE]);
  }

  navigateToNewClient() {
    this.router.navigate(['/home/', ...NavigationService.NEW_CLIENT.split('/')]);
  }
  navigateToClientDetails(id: string) {
    // let targetUrl = NavigationService.CLIENT_DETAILS.replace(":id", id);
    // this.router.navigate(['/home/', ...targetUrl.split("/")]);
    this.router.navigate([NavigationService.HOME, NavigationService.CLIENT_DETAILS], { queryParams: { id: id } });
  }

  navigateToClientEdit(id: string) {
    let targetUrl = NavigationService.CLIENT_EDIT.replace(":id", id);
    this.router.navigate(['/home/', ...targetUrl.split("/")]);
  }

  navigateToClientAMLReview(id: string) {
    let targetUrl = NavigationService.CLIENT_AML_REVIEW.replace(":id", id);
    this.router.navigate(['/home/', ...targetUrl.split("/")]);
  }

  navigateToClientAMLReviewResult(id: string) {
    let targetUrl = NavigationService.CLIENT_AML_RESULT.replace(":id", id);
    this.router.navigate(['/home/', ...targetUrl.split("/")]);
  }

  navigateToDiligenceFormBuilder() {
    this.router.navigate(['/home/', NavigationService.DILIGENCE_FORM_BUILDER]);
  }

  navigateToDiligenceFormViewer(id: string, clientId?: string) {
    if (clientId) {
      this.router.navigate(['/home/', ...NavigationService.DILIGENCE_FORM_VIEWER.replace(":id", id).split("/")], { queryParams: { clientId: clientId } });
    } else {
      let targetUrl = NavigationService.DILIGENCE_FORM_VIEWER.replace(":id", id);
      this.router.navigate(['/home/', ...targetUrl.split("/")]);
    }
  }

  navigateToClientDiligenceResults(id: string) {
    let targetUrl = NavigationService.CLIENT_DILIGENCE_RESULTS.replace(":id", id);
    this.router.navigate(['/home/', ...targetUrl.split("/")]);
  }

  navigateToDiligenceFormResultViewer(id: string) {
    let targetUrl = NavigationService.DILIGENCE_FORM_RESULT_VIEWER.replace(":id", id);
    this.router.navigate(['/home/', ...targetUrl.split("/")]);
  }





  navigateToDiligenceFormList() {
    this.router.navigate(['/home/', NavigationService.DILIGENCE_FORM_LIST]);
  }

  navigateToDiligenceFormBuilderEdit(id: string) {
    let targetUrl = NavigationService.DILIGENCE_FORM_BUILDER_EDIT.replace(":id", id);
    this.router.navigate(['/home/', ...targetUrl.split("/")]);
  }

  navigateToDossierStatusForm() {
    this.router.navigate([NavigationService.HOME, NavigationService.DOSSIER_STATUS_FORM]);
  }

  navigateToDossierPriorite() {
    this.router.navigate([NavigationService.HOME, NavigationService.DOSSIER_PRIORITE]);
  }

  navigateToDomaineJuridique() {
    this.router.navigate([NavigationService.HOME, NavigationService.DOMAINE_JURIDIQUE]);
  }

  navigateToTaskCategory() {
    this.router.navigate([NavigationService.HOME, NavigationService.TASK_CATEGORY]);
  }

  navigateToTaskStatus() {
    this.router.navigate([NavigationService.HOME, NavigationService.TASK_STATUS]);
  }

  navigateToNoteCategory() {
    this.router.navigate([NavigationService.HOME, NavigationService.NOTE_CATEGORY]);
  }

  navigateToDossierDetails(id: string) {
    let targetUrl = NavigationService.DOSSIER_DETAIL.replace(":id", id);
    this.router.navigate(['/home/', ...targetUrl.split("/")]);
  }

}
