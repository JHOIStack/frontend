import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { HabitService, Habit } from '../core/services/habit.service';
import { StatsService } from '../core/services/stats.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatChipsModule,
    MatBadgeModule,
    RouterModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.3s ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('0.3s ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class DashboardComponent implements OnInit {
  currentDate = new Date();
  totalHabits = 0;
  completedToday = 0;
  pendingToday = 0;
  currentStreak = 0;
  todayHabits: Habit[] = [];
  dailyMotivation = '';
  userName = '';
  loadingHabits = false;

  // Nuevas funcionalidades
  weeklyProgress = 0;
  achievements: any[] = [];
  recommendedHabits: any[] = [];
  showNotifications = false;
  notifications: any[] = [];

  constructor(
    private habitService: HabitService,
    private statsService: StatsService,
    private authService: AuthService
  ) {
    console.log('DashboardComponent initialized');
  }

  ngOnInit() {
    console.log('DashboardComponent ngOnInit called');
    this.loadUserInfo();
    this.loadDashboardData();
    this.loadDailyMotivation();
    this.loadAchievements();
    this.loadRecommendedHabits();
    this.checkForNotifications();
  }

  loadUserInfo() {
    const user = this.authService.getUser();
    console.log('User data from AuthService:', user);
    if (user && user.name) {
      this.userName = user.name.split(' ')[0];
      console.log('Extracted user name:', this.userName);
    } else {
      console.log('No user data found or user has no name');
      this.userName = '';
    }
  }

  loadDashboardData() {
    console.log('Loading dashboard data...');
    this.loadingHabits = true;
    
    const token = this.authService.getToken();
    console.log('Current auth token:', token ? 'Present' : 'Missing');
    
    const isAuthenticated = this.authService.isAuthenticated();
    console.log('User is authenticated:', isAuthenticated);
    
    this.habitService.getUserHabits().subscribe({
      next: (userHabits) => {
        console.log('Successfully loaded user habits:', userHabits);
        console.log('Number of user habits received:', userHabits.length);
        
        if (userHabits.length > 0) {
          this.todayHabits = userHabits.slice(0, 5);
          this.totalHabits = userHabits.length;
          this.completedToday = userHabits.filter(h => h.completed).length;
          this.pendingToday = this.totalHabits - this.completedToday;
          this.calculateWeeklyProgress();
          console.log('Using user-specific habits');
        } else {
          console.log('No user-specific habits found, loading general habits...');
          this.habitService.getAllAvailableHabits().subscribe({
            next: (generalHabits) => {
              console.log('Successfully loaded general habits:', generalHabits);
              
              const habitsWithCompletion = generalHabits.map((habit, index) => ({
                ...habit,
                completed: index % 3 === 0
              }));
              
              this.todayHabits = habitsWithCompletion.slice(0, 5);
              this.totalHabits = habitsWithCompletion.length;
              this.completedToday = habitsWithCompletion.filter(h => h.completed).length;
              this.pendingToday = this.totalHabits - this.completedToday;
              this.calculateWeeklyProgress();
              console.log('Using general habits with simulated completion');
            },
            error: (error) => {
              console.error('Error loading general habits:', error);
            }
          });
        }
        
        this.loadingHabits = false;
        console.log('Dashboard data updated:', {
          totalHabits: this.totalHabits,
          completedToday: this.completedToday,
          pendingToday: this.pendingToday,
          todayHabits: this.todayHabits
        });
      },
      error: (error) => {
        console.error('Error al cargar hábitos del usuario:', error);
        
        this.habitService.getAllAvailableHabits().subscribe({
          next: (generalHabits) => {
            console.log('Successfully loaded general habits as fallback:', generalHabits);
            
            const habitsWithCompletion = generalHabits.map((habit, index) => ({
              ...habit,
              completed: index % 3 === 0
            }));
            
            this.todayHabits = habitsWithCompletion.slice(0, 5);
            this.totalHabits = habitsWithCompletion.length;
            this.completedToday = habitsWithCompletion.filter(h => h.completed).length;
            this.pendingToday = this.totalHabits - this.completedToday;
            this.calculateWeeklyProgress();
            this.loadingHabits = false;
          },
          error: (fallbackError) => {
            console.error('Error loading general habits as fallback:', fallbackError);
            this.loadingHabits = false;
          }
        });
      }
    });

    this.statsService.getCurrentStreak().subscribe({
      next: (streak) => {
        console.log('Successfully loaded streak:', streak);
        this.currentStreak = streak;
      },
      error: (error) => {
        console.error('Error al cargar streak:', error);
      }
    });
  }

  calculateWeeklyProgress() {
    // Simular progreso semanal basado en hábitos completados
    const completedThisWeek = this.completedToday * 7; // Simulación
    const totalPossible = this.totalHabits * 7;
    this.weeklyProgress = totalPossible > 0 ? Math.round((completedThisWeek / totalPossible) * 100) : 0;
  }

  loadAchievements() {
    this.achievements = [
      {
        id: 1,
        name: 'Primer Paso',
        description: 'Completaste tu primer hábito',
        icon: 'star',
        unlocked: this.completedToday > 0,
        color: '#4caf50'
      },
      {
        id: 2,
        name: 'Consistencia',
        description: '3 días seguidos de hábitos',
        icon: 'local_fire_department',
        unlocked: this.currentStreak >= 3,
        color: '#ff9800'
      },
      {
        id: 3,
        name: 'Variedad',
        description: 'Hábitos en 3 categorías diferentes',
        icon: 'category',
        unlocked: this.totalHabits >= 3,
        color: '#2196f3'
      },
      {
        id: 4,
        name: 'Maestro Verde',
        description: '10 hábitos completados en una semana',
        icon: 'eco',
        unlocked: this.weeklyProgress >= 70,
        color: '#9c27b0'
      }
    ];
  }

  loadRecommendedHabits() {
    // Simular hábitos recomendados basados en el progreso del usuario
    this.recommendedHabits = [
      {
        id: 'rec1',
        name: 'Usar transporte público',
        description: 'Reduce tu huella de carbono',
        category: 'MOVILIDAD',
        difficulty: 'Fácil',
        impact: 'Alto'
      },
      {
        id: 'rec2',
        name: 'Comprar productos locales',
        description: 'Apoya la economía local y reduce emisiones',
        category: 'CONSUMO',
        difficulty: 'Medio',
        impact: 'Medio'
      },
      {
        id: 'rec3',
        name: 'Compostar residuos orgánicos',
        description: 'Reduce basura y crea fertilizante natural',
        category: 'RESIDUOS',
        difficulty: 'Medio',
        impact: 'Alto'
      }
    ];
  }

  checkForNotifications() {
    // Simular notificaciones basadas en el progreso
    this.notifications = [];
    
    if (this.completedToday === 0) {
      this.notifications.push({
        type: 'info',
        message: '¡Comienza tu día con un hábito sostenible!',
        icon: 'lightbulb'
      });
    }
    
    if (this.currentStreak >= 3) {
      this.notifications.push({
        type: 'success',
        message: `¡Excelente! Mantienes un streak de ${this.currentStreak} días`,
        icon: 'local_fire_department'
      });
    }
    
    if (this.weeklyProgress >= 80) {
      this.notifications.push({
        type: 'achievement',
        message: '¡Semana increíble! Has superado el 80% de tus objetivos',
        icon: 'emoji_events'
      });
    }
    
    this.showNotifications = this.notifications.length > 0;
  }

  loadDailyMotivation() {
    const motivations = [
      'Cada pequeño cambio que haces hoy es un paso hacia un planeta más sostenible mañana.',
      'La consistencia en tus hábitos ecológicos es más importante que la perfección.',
      'Cada día es una nueva oportunidad para reducir tu huella de carbono.',
      'Los hábitos sostenibles son el interés compuesto de la conservación ambiental.',
      'La disciplina ecológica es el puente entre la conciencia y la acción climática.',
      'El progreso hacia la sostenibilidad, no la perfección, es lo que importa.',
      'Los hábitos respetuosos con el medio ambiente crean un futuro más verde.',
      'Cada hábito sostenible que construyes es un paso hacia la regeneración del planeta.',
      'Tu impacto individual multiplicado por millones puede cambiar el mundo.',
      'La naturaleza no necesita que seamos perfectos, solo que seamos consistentes.',
      'Cada gota de agua ahorrada, cada residuo reciclado, cuenta para el futuro.',
      'La sostenibilidad no es una moda, es la única opción para nuestro futuro.',
      'Pequeños cambios en tu rutina diaria pueden tener un gran impacto en el planeta.',
      'El tiempo de actuar es ahora, cada día cuenta para la salud de nuestro planeta.',
      'Tu compromiso diario con la sostenibilidad inspira a otros a hacer lo mismo.'
    ];
    
    const today = new Date().getDate();
    this.dailyMotivation = motivations[today % motivations.length];
  }

  toggleHabit(habit: Habit) {
    console.log('Toggling habit:', habit);
    const newCompletedState = !habit.completed;
    
    this.completedToday = this.todayHabits.filter(h => h.completed).length;
    this.pendingToday = this.totalHabits - this.completedToday;

    if (habit.userHabitId) {
      this.habitService.toggleHabitCompletion(habit, newCompletedState).subscribe({
        next: (updatedHabit) => {
          console.log('Successfully updated habit:', updatedHabit);
          habit.completed = updatedHabit.completed;
          
          this.completedToday = this.todayHabits.filter(h => h.completed).length;
          this.pendingToday = this.totalHabits - this.completedToday;
          this.calculateWeeklyProgress();
          this.loadAchievements();
          this.checkForNotifications();
        },
        error: (error) => {
          console.error('Error al actualizar hábito:', error);
          habit.completed = !newCompletedState;
          this.completedToday = this.todayHabits.filter(h => h.completed).length;
          this.pendingToday = this.totalHabits - this.completedToday;
        }
      });
    } else {
      console.log('Updating habit locally (no userHabitId found)');
      habit.completed = newCompletedState;
      
      this.completedToday = this.todayHabits.filter(h => h.completed).length;
      this.pendingToday = this.totalHabits - this.completedToday;
      this.calculateWeeklyProgress();
      this.loadAchievements();
      this.checkForNotifications();
    }
  }

  dismissNotification(index: number) {
    this.notifications.splice(index, 1);
    this.showNotifications = this.notifications.length > 0;
  }

  trackByHabitId(index: number, habit: Habit): string {
    return habit.id;
  }

  getAchievementIcon(achievement: any): string {
    return achievement.unlocked ? achievement.icon : 'lock';
  }

  getDifficultyColor(difficulty: string): string {
    const colors = {
      'Fácil': '#4caf50',
      'Medio': '#ff9800',
      'Difícil': '#f44336'
    };
    return colors[difficulty as keyof typeof colors] || '#757575';
  }

  getImpactColor(impact: string): string {
    const colors = {
      'Alto': '#4caf50',
      'Medio': '#ff9800',
      'Bajo': '#757575'
    };
    return colors[impact as keyof typeof colors] || '#757575';
  }
}
