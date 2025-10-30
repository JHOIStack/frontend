import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  animations: [
    trigger('slideInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('buttonPulse', [
      state('normal', style({ transform: 'scale(1)' })),
      state('pulse', style({ transform: 'scale(1.02)' })),
      transition('normal <=> pulse', [
        animate('0.3s ease-in-out')
      ])
    ]),
    trigger('shake', [
      transition(':enter', [
        animate('0.5s', style({
          animation: 'shake 0.5s ease-in-out'
        }))
      ])
    ])
  ]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
    console.log('LoginComponent initialized');
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.error = '';

      const { email, password } = this.loginForm.value;
      
      console.log('Submitting login form with email:', email);

      this.authService.login(email, password).subscribe({
        next: (response) => {
          console.log('Login response received:', response);
          this.loading = false;
          
          this.snackBar.open('¡Inicio de sesión exitoso!', 'Cerrar', { 
            duration: 2000,
            panelClass: ['success-snackbar']
          });
          
          // Redirigir al dashboard
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Login error:', error);
          this.loading = false;
          this.error = 'Error al iniciar sesión. Por favor, intenta de nuevo.';
        }
      });
    }
  }
}
