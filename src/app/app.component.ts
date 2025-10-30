import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { LoaderService } from './core/services/loader.service';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { AsyncPipe, NgIf } from '@angular/common';
import { HabitService } from './core/services/habit.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NavbarComponent, LoaderComponent, AsyncPipe, NgIf, RouterOutlet, MatSnackBarModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  loader$;
  constructor(
    private loaderService: LoaderService,
    private habitService: HabitService,
    private snackBar: MatSnackBar,
    public auth: AuthService,
    private router: Router
  ) {
    this.loader$ = this.loaderService.loading$;
    this.showPendingReminder();
  }

  isAuthPage(): boolean {
    const currentUrl = this.router.url;
    return currentUrl.startsWith('/auth') || currentUrl === '/';
  }

  showPendingReminder() {
    this.habitService.getPendingHabitsCount().subscribe({
      next: count => {
        if (count > 0) {
          this.snackBar.open(`Tienes ${count} hábito${count > 1 ? 's' : ''} pendiente${count > 1 ? 's' : ''} para hoy. ¡No olvides cumplirlos!`, 'Cerrar', { duration: 5000 });
        }
      }
    });
  }
}
