import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="not-found-container">
      <mat-icon class="not-found-icon">sentiment_dissatisfied</mat-icon>
      <h1>Página no encontrada</h1>
      <p>La ruta que buscas no existe o no tienes acceso.</p>
      <button mat-raised-button color="primary" (click)="goHome()">Volver al inicio</button>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      gap: 1.2rem;
      text-align: center;
    }
    .not-found-icon {
      font-size: 4rem;
      color: #388e3c;
    }
  `]
})
export class NotFoundComponent {
  constructor(private router: Router) {}
  goHome() {
    this.router.navigate(['/dashboard']);
  }
} 