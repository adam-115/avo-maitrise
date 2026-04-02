import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavigationService } from '../../services/navigation-service';
import { UserService } from '../../services/user.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {

  private readonly navigationService = inject(NavigationService);
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);

  loginForm!: FormGroup;
  errorMessage: string | null = null;
  environment = environment;

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  navigateToHomePage() {
    this.errorMessage = null;


    if (environment.production) {
      this.navigationService.navigateToHome();
    }
    if (this.loginForm.valid) {
      const email = this.loginForm.value.email;

      this.userService.getAll().subscribe({
        next: (users) => {
          const userExists = users.find(u => u.email === email);
          if (userExists) {
            this.navigationService.navigateToHome();
          } else {
            this.errorMessage = "Email non trouvé ou utilisateur inexistant.";
          }
        },
        error: (err) => {
          console.error("Erreur de connexion au serveur", err);
          this.errorMessage = "Erreur lors de la vérification de l'utilisateur.";
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

}
