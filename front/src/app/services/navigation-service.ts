import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Paths } from '../paths';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {

  private readonly router = inject(Router);

  // AML Compliance Navigation
  public static readonly AML_FORM_CONFIG_LIST = "aml-form-config-list";
  public static readonly FORM_CONFIG_CREATE = "form-config/create";
  public static readonly FORM_CONFIG_EDIT = "form-config/edit/:id";
  public static readonly FORM_CONFIG_VIEW = "form-config/view/:id";
  public static readonly FORM_RESULT_VIEW = "form-result/view/:id";
  public static readonly TYPE_CLIENT = "type_client";
  public static readonly ADMIN_PREFERENCE = "admin_preference";
  public static readonly ADMIN_SECTEUR_ATIVITE = "admin_secteur_activite";




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

  public navigateToViewFormConfig(id: number): void {
    let targetUrl = NavigationService.FORM_CONFIG_VIEW.replace(":id", id.toString());
    this.router.navigate(['/home/', ...targetUrl.split("/")]);
  }


  public navigateToTypeClient(): void {
    this.router.navigate(['/home/', ...NavigationService.TYPE_CLIENT.split('/')]);
  }


  navigateTOClients(): void {
    this.router.navigateByUrl(Paths.HOME + '/' + Paths.CRM);
  }

  navigateToClientForm() {
    this.router.navigate([Paths.HOME, Paths.CLIENT_FORM]);
  }

  navigateToAdminPrefences() {
    this.router.navigate([Paths.HOME, NavigationService.ADMIN_PREFERENCE]);
  }

  navigateToPrefrenceTypeClient() {
    this.router.navigate([Paths.HOME, NavigationService.TYPE_CLIENT]);
  }

  navigateToAdminSecteurActivite() {
    this.router.navigate([Paths.HOME, NavigationService.ADMIN_SECTEUR_ATIVITE]);
  }




}
