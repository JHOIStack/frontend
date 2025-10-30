import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterModule } from '@angular/router';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
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
    MatSelectModule,
    RouterModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
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
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  error = '';
  regions = ['NORTE', 'CENTRO', 'SUR', 'ESTE', 'OESTE'];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      age: ['', [Validators.required, Validators.min(13), Validators.max(120)]],
      region: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    console.log('RegisterComponent initialized');
  }

  // Validador personalizado para verificar que las contraseñas coincidan
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.loading = true;
      this.error = '';

      const formData = this.registerForm.value;
      
      console.log('Submitting registration form with data:', formData);

      this.authService.register(formData).subscribe({
        next: (response) => {
          console.log('Registration response received:', response);
          this.loading = false;
          
          this.snackBar.open('¡Registro exitoso! Bienvenido a SmartHabits', 'Cerrar', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          
          // Redirigir al dashboard después de un breve delay
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 2000);
        },
        error: (error) => {
          console.error('Registration error:', error);
          this.loading = false;
          this.error = 'Error al registrar. Por favor, intenta de nuevo.';
          
          // Mostrar error en snackbar también
          this.snackBar.open('Error al registrar. Por favor, intenta de nuevo.', 'Cerrar', { 
            duration: 4000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
      
      this.error = 'Por favor, completa todos los campos correctamente.';
    }
  }
}
