import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { trigger, transition, style, animate } from '@angular/animations';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { StatsService, Stats, UserStats, CategoryStats } from '../core/services/stats.service';
import { HabitService, Habit } from '../core/services/habit.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss',
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideInLeft', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-30px)' }),
        animate('0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('pulse', [
      transition(':enter', [
        animate('0.3s ease-in-out', style({ transform: 'scale(1.05)' })),
        animate('0.3s ease-in-out', style({ transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class StatsComponent implements OnInit, OnDestroy {
  @ViewChild('completionChart') completionChartRef!: ElementRef;
  @ViewChild('categoryChart') categoryChartRef!: ElementRef;
  @ViewChild('weeklyChart') weeklyChartRef!: ElementRef;

  stats: Stats | null = null;
  userStats: UserStats | null = null;
  categoryStats: CategoryStats[] = [];
  loading = false;
  error: string | null = null;
  selectedTimeframe: 'week' | 'month' | 'year' = 'week';
  currentUser: any = null;

  // Charts
  private completionChart: Chart | null = null;
  private categoryChart: Chart | null = null;
  private weeklyChart: Chart | null = null;

  private statsService = inject(StatsService);
  private habitService = inject(HabitService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  constructor() {
    // Registrar todos los componentes de Chart.js
    Chart.register(...registerables);
  }

  ngOnInit() {
    this.currentUser = this.authService.getUser();
    this.fetchStats();
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  fetchStats() {
    this.loading = true;
    this.error = null;

    this.statsService.getStats().subscribe({
      next: (data: Stats) => {
        console.log('Stats data received:', data);
        this.stats = data;
        this.userStats = data.userStats;
        this.categoryStats = data.categoryStats;
        this.loading = false;
        
        // Inicializar gráficos después de que los datos estén disponibles
        setTimeout(() => {
          this.initializeCharts();
        }, 300); // Aumentar el tiempo de espera
      },
      error: (err: any) => {
        console.error('Error fetching stats:', err);
        this.error = 'Error al cargar estadísticas';
        this.loading = false;
        this.snackBar.open('Error al cargar estadísticas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private initializeCharts() {
    console.log('Initializing charts...');
    console.log('UserStats:', this.userStats);
    console.log('CategoryStats:', this.categoryStats);
    console.log('Stats:', this.stats);
    
    // Verificar que los elementos del DOM estén disponibles
    if (!this.completionChartRef?.nativeElement || 
        !this.categoryChartRef?.nativeElement || 
        !this.weeklyChartRef?.nativeElement) {
      console.log('Chart elements not ready, retrying in 500ms...');
      setTimeout(() => {
        this.initializeCharts();
      }, 500);
      return;
    }
    
    // Destruir gráficos existentes
    this.destroyCharts();
    
    // Esperar un poco más para asegurar que el DOM esté listo
    setTimeout(() => {
      this.createCompletionChart();
      this.createCategoryChart();
      this.createWeeklyChart();
    }, 200);
  }

  private createCompletionChart() {
    console.log('Creating completion chart...');
    console.log('UserStats:', this.userStats);
    console.log('CompletionChartRef:', this.completionChartRef);
    
    if (!this.completionChartRef) {
      console.log('Completion chart ref not available');
      return;
    }

    const ctx = this.completionChartRef.nativeElement.getContext('2d');
    if (!ctx) {
      console.log('Could not get 2D context for completion chart');
      return;
    }
    
    // Asegurar que tenemos datos válidos
    let completed = 0;
    let pending = 0;
    
    if (this.userStats) {
      completed = this.userStats.completedToday || 0;
      pending = this.userStats.pendingToday || 0;
    } else {
      // Datos de prueba si no hay userStats
      completed = 3;
      pending = 2;
    }
    
    console.log('Chart data - Completed:', completed, 'Pending:', pending);
    
    const config: ChartConfiguration = {
      type: 'doughnut' as ChartType,
      data: {
        labels: ['Completados', 'Pendientes'],
        datasets: [{
          data: [completed, pending],
          backgroundColor: ['#4CAF50', '#FF9800'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#4CAF50',
            borderWidth: 1
          }
        }
      }
    };

    try {
      this.completionChart = new Chart(ctx, config);
      console.log('Completion chart created successfully');
    } catch (error) {
      console.error('Error creating completion chart:', error);
    }
  }

  private createCategoryChart() {
    console.log('Creating category chart...');
    console.log('CategoryStats:', this.categoryStats);
    console.log('CategoryChartRef:', this.categoryChartRef);
    
    if (!this.categoryChartRef) {
      console.log('Category chart ref not available');
      return;
    }

    const ctx = this.categoryChartRef.nativeElement.getContext('2d');
    if (!ctx) {
      console.log('Could not get 2D context for category chart');
      return;
    }
    
    // Usar datos de prueba si no hay categoryStats
    let chartData = this.categoryStats;
    if (!chartData || chartData.length === 0) {
      chartData = [
        { category: 'SALUD', count: 3, completed: 2, percentage: 67 },
        { category: 'EJERCICIO', count: 2, completed: 1, percentage: 50 },
        { category: 'ALIMENTACION', count: 2, completed: 1, percentage: 50 }
      ];
    }
    
    console.log('Category chart data:', chartData);
    
    const config: ChartConfiguration = {
      type: 'bar' as ChartType,
      data: {
        labels: chartData.map(cat => cat.category),
        datasets: [{
          label: 'Completados',
          data: chartData.map(cat => cat.completed),
          backgroundColor: '#4CAF50',
          borderRadius: 4
        }, {
          label: 'Pendientes',
          data: chartData.map(cat => cat.count - cat.completed),
          backgroundColor: '#FF9800',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              font: {
                size: 12
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    try {
      this.categoryChart = new Chart(ctx, config);
      console.log('Category chart created successfully');
    } catch (error) {
      console.error('Error creating category chart:', error);
    }
  }

  private createWeeklyChart() {
    console.log('Creating weekly chart...');
    console.log('Stats:', this.stats);
    console.log('WeeklyProgress:', this.stats?.weeklyProgress);
    console.log('WeeklyChartRef:', this.weeklyChartRef);
    
    if (!this.weeklyChartRef) {
      console.log('Weekly chart ref not available');
      return;
    }

    const ctx = this.weeklyChartRef.nativeElement.getContext('2d');
    if (!ctx) {
      console.log('Could not get 2D context for weekly chart');
      return;
    }
    
    // Usar datos de prueba si no hay weeklyProgress
    let chartData = this.stats?.weeklyProgress;
    if (!chartData || chartData.length === 0) {
      const today = new Date();
      chartData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        chartData.push({
          date: date.toISOString().split('T')[0],
          completed: Math.floor(Math.random() * 5) + 1,
          total: 5
        });
      }
    }
    
    console.log('Weekly chart data:', chartData);
    
    const config: ChartConfiguration = {
      type: 'line' as ChartType,
      data: {
        labels: chartData.map(day => {
          const date = new Date(day.date);
          return date.toLocaleDateString('es-ES', { weekday: 'short' });
        }),
        datasets: [{
          label: 'Hábitos Completados',
          data: chartData.map(day => day.completed),
          borderColor: '#2196F3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#2196F3',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    try {
      this.weeklyChart = new Chart(ctx, config);
      console.log('Weekly chart created successfully');
    } catch (error) {
      console.error('Error creating weekly chart:', error);
    }
  }

  private destroyCharts() {
    if (this.completionChart) {
      this.completionChart.destroy();
      this.completionChart = null;
    }
    if (this.categoryChart) {
      this.categoryChart.destroy();
      this.categoryChart = null;
    }
    if (this.weeklyChart) {
      this.weeklyChart.destroy();
      this.weeklyChart = null;
    }
  }

  onTimeframeChange(timeframe: 'week' | 'month' | 'year') {
    this.selectedTimeframe = timeframe;
    // Aquí podrías recargar datos específicos para el timeframe seleccionado
    this.snackBar.open(`Cambiando a vista de ${timeframe}`, 'Cerrar', { duration: 2000 });
  }

  getCompletionRate(): number {
    if (!this.userStats) return 0;
    return this.userStats.completionRate;
  }

  getStreakColor(): string {
    if (!this.userStats) return '#ccc';
    if (this.userStats.currentStreak >= 7) return '#4CAF50';
    if (this.userStats.currentStreak >= 3) return '#FF9800';
    return '#F44336';
  }

  getCategoryColor(category: string): string {
    const colors = {
      'SALUD': '#4CAF50',
      'EJERCICIO': '#2196F3',
      'ALIMENTACION': '#FF9800',
      'MENTAL': '#9C27B0',
      'PRODUCTIVIDAD': '#607D8B',
      'RESIDUOS': '#795548',
      'MOVILIDAD': '#E91E63',
      'DEFAULT': '#607D8B'
    };
    return colors[category as keyof typeof colors] || colors.DEFAULT;
  }

  refreshStats() {
    this.destroyCharts();
    this.fetchStats();
    this.snackBar.open('Estadísticas actualizadas', 'Cerrar', { duration: 2000 });
  }
}
