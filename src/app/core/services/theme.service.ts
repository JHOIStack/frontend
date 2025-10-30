import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSubject = new BehaviorSubject<Theme>('light');
  public theme$ = this.themeSubject.asObservable();

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    // Obtener tema guardado en localStorage o usar preferencia del sistema
    const savedTheme = localStorage.getItem('theme') as Theme;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    this.setTheme(initialTheme);
  }

  getCurrentTheme(): Theme {
    return this.themeSubject.value;
  }

  isDarkTheme(): boolean {
    return this.getCurrentTheme() === 'dark';
  }

  setTheme(theme: Theme): void {
    this.themeSubject.next(theme);
    localStorage.setItem('theme', theme);
    this.updateBodyClass(theme);
  }

  toggleTheme(): void {
    const currentTheme = this.getCurrentTheme();
    const newTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  private updateBodyClass(theme: Theme): void {
    // Remover clase dark-theme si existe
    document.body.classList.remove('dark-theme');
    
    // Agregar clase dark-theme solo si el tema es oscuro
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    }
  }

  // Escuchar cambios en las preferencias del sistema
  watchSystemPreference(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', (e) => {
      // Solo cambiar si no hay un tema guardado explícitamente
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        const newTheme: Theme = e.matches ? 'dark' : 'light';
        this.setTheme(newTheme);
      }
    });
  }
} 