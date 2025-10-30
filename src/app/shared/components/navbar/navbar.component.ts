import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

import { AuthService } from '../../../core/services/auth.service';
import { HabitService } from '../../../core/services/habit.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule, 
    MatToolbarModule, 
    MatButtonModule, 
    MatIconModule, 
    MatMenuModule, 
    MatTooltipModule, 
    MatBadgeModule, 
    MatDividerModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  pendingCount: number = 0;
  pendingInterval: any;
  isDarkTheme: boolean = false;
  currentRoute: string = '';
  showBreadcrumbs: boolean = false;
  breadcrumbs: any[] = [];

  constructor(
    public auth: AuthService,
    private router: Router,
    private habitService: HabitService,
    public themeService: ThemeService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.fetchPendingCount();
    this.pendingInterval = setInterval(() => this.fetchPendingCount(), 60000);
    
    // Suscribirse a cambios del tema
    this.themeService.theme$.subscribe(theme => {
      this.isDarkTheme = theme === 'dark';
    });
    
    // Escuchar cambios en las preferencias del sistema
    this.themeService.watchSystemPreference();

    // Escuchar cambios de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.url;
      this.updateBreadcrumbs();
      this.checkRouteNotifications();
    });


  }

  ngOnDestroy() {
    if (this.pendingInterval) clearInterval(this.pendingInterval);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
    this.snackBar.open('Sesión cerrada exitosamente', 'Cerrar', { duration: 2000 });
  }

  fetchPendingCount() {
    if (!this.auth.isAuthenticated()) {
      this.pendingCount = 0;
      return;
    }
    this.habitService.getPendingHabitsCount().subscribe({
      next: count => this.pendingCount = count,
      error: () => this.pendingCount = 0
    });
  }



  updateBreadcrumbs() {
    this.breadcrumbs = [];
    this.showBreadcrumbs = false;

    const routes = this.currentRoute.split('/').filter(segment => segment);
    
    if (routes.length > 1) {
      this.showBreadcrumbs = true;
      let currentPath = '';

      routes.forEach((route, index) => {
        currentPath += `/${route}`;
        
        const breadcrumb = {
          label: this.getBreadcrumbLabel(route),
          path: currentPath,
          icon: this.getBreadcrumbIcon(route),
          isLast: index === routes.length - 1
        };

        this.breadcrumbs.push(breadcrumb);
      });
    }
  }

  getBreadcrumbLabel(route: string): string {
    const labels: { [key: string]: string } = {
      'dashboard': 'Inicio',
      'habits': 'Hábitos',
      'stats': 'Estadísticas',
      'new': 'Nuevo',
      'edit': 'Editar',
      'auth': 'Autenticación',
      'login': 'Iniciar Sesión',
      'register': 'Registrarse'
    };
    return labels[route] || route.charAt(0).toUpperCase() + route.slice(1);
  }

  getBreadcrumbIcon(route: string): string {
    const icons: { [key: string]: string } = {
      'dashboard': 'dashboard',
      'habits': 'eco',
      'stats': 'analytics',
      'new': 'add',
      'edit': 'edit',
      'auth': 'security',
      'login': 'login',
      'register': 'person_add'
    };
    return icons[route] || 'navigate_next';
  }

  checkRouteNotifications() {
    // Notificaciones específicas por ruta
    const notifications: { [key: string]: string } = {
      '/habits': '¡Gestiona tus hábitos sostenibles!',
      '/stats': 'Revisa tu progreso ambiental'
    };

    const notification = notifications[this.currentRoute];
    if (notification) {
      setTimeout(() => {
        this.snackBar.open(notification, 'Cerrar', { 
          duration: 3000,
          panelClass: ['info-snackbar']
        });
      }, 500);
    }
  }

  toggleTheme() {
    this.themeService.toggleTheme();
    const theme = this.isDarkTheme ? 'oscuro' : 'claro';
    this.snackBar.open(`Tema ${theme} activado`, 'Cerrar', { duration: 1500 });
  }



  navigateToBreadcrumb(breadcrumb: any) {
    if (!breadcrumb.isLast) {
      this.router.navigate([breadcrumb.path]);
    }
  }

  getCurrentUserDisplayName(): string {
    const user = this.auth.getUser();
    if (user && user.name) {
      return user.name.split(' ')[0]; // Primer nombre
    }
    return 'Usuario';
  }

  getCurrentUserAvatar(): string {
    const user = this.auth.getUser();
    if (user && user.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return 'U';
  }
}
