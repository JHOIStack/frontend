import { Component, OnInit } from '@angular/core';
import { HabitService, Habit } from '../../core/services/habit.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LoaderService } from '../../core/services/loader.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgIf, NgForOf } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDeleteDialogComponent } from '../confirm-delete-dialog.component';

@Component({
  selector: 'app-habit-list',
  standalone: true,
  imports: [
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatProgressSpinnerModule, 
    MatChipsModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    RouterModule, 
    MatSnackBarModule, 
    MatDialogModule, 
    NgIf, 
    NgForOf
  ],
  templateUrl: './habit-list.component.html',
  styleUrl: './habit-list.component.scss',
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
export class HabitListComponent implements OnInit {
  habits: Habit[] = [];
  filteredHabits: Habit[] = [];
  loading = false;
  error: string | null = null;

  // Filtros y búsqueda
  searchControl = new FormControl('');
  categoryFilter = new FormControl('');
  statusFilter = new FormControl('');
  viewMode: 'grid' | 'list' = 'grid';

  // Estadísticas
  totalHabits = 0;
  completedHabits = 0;
  pendingHabits = 0;
  completionRate = 0;

  // Categorías disponibles
  categories = [
    { value: '', label: 'Todas las categorías' },
    { value: 'ENERGIA', label: 'Energía' },
    { value: 'CONSUMO', label: 'Consumo' },
    { value: 'AGUA', label: 'Agua' },
    { value: 'MOVILIDAD', label: 'Movilidad' },
    { value: 'RESIDUOS', label: 'Residuos' }
  ];

  // Estados disponibles
  statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'completed', label: 'Completados' },
    { value: 'pending', label: 'Pendientes' }
  ];

  constructor(
    private habitService: HabitService,
    private snackBar: MatSnackBar,
    private loader: LoaderService,
    private dialog: MatDialog,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadHabits();
    this.setupFilters();
  }

  setupFilters() {
    // Observar cambios en los filtros
    this.searchControl.valueChanges.subscribe(() => this.applyFilters());
    this.categoryFilter.valueChanges.subscribe(() => this.applyFilters());
    this.statusFilter.valueChanges.subscribe(() => this.applyFilters());
  }

  applyFilters() {
    let filtered = [...this.habits];

    // Filtro de búsqueda
    const searchTerm = this.searchControl.value?.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter(habit => 
        habit.name.toLowerCase().includes(searchTerm) ||
        habit.description.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro de categoría
    const category = this.categoryFilter.value;
    if (category) {
      filtered = filtered.filter(habit => habit.category === category);
    }

    // Filtro de estado
    const status = this.statusFilter.value;
    if (status) {
      filtered = filtered.filter(habit => {
        if (status === 'completed') return habit.completed;
        if (status === 'pending') return !habit.completed;
        return true;
      });
    }

    this.filteredHabits = filtered;
    this.updateStatistics();
  }

  updateStatistics() {
    this.totalHabits = this.habits.length;
    this.completedHabits = this.habits.filter(h => h.completed).length;
    this.pendingHabits = this.totalHabits - this.completedHabits;
    this.completionRate = this.totalHabits > 0 ? Math.round((this.completedHabits / this.totalHabits) * 100) : 0;
  }

  loadHabits() {
    this.loading = true;
    this.loader.show();
    this.error = null;

    const currentUser = this.authService.getUser();
    const isAuthenticated = this.authService.isAuthenticated();
    
    console.log('=== DEBUG: User Authentication ===');
    console.log('Is authenticated:', isAuthenticated);
    console.log('Current user:', currentUser);
    console.log('User ID:', currentUser?.id);
    console.log('Token present:', !!this.authService.getToken());
    console.log('================================');

    this.habitService.getUserHabits().subscribe({
      next: (userHabits) => {
        console.log('Loaded user habits:', userHabits);
        
        if (userHabits.length > 0) {
          // Cargar hábitos del usuario y sincronizar con el almacenamiento local
          this.habits = this.syncHabitsWithLocalStorage(userHabits);
          this.filteredHabits = [...this.habits];
          this.loading = false;
          this.loader.hide();
          this.updateStatistics();
          console.log('Using user-specific habits');
        } else {
          console.log('No user-specific habits found, loading general habits...');
          this.habitService.getAllAvailableHabits().subscribe({
            next: (generalHabits) => {
              console.log('Loaded general habits:', generalHabits);
              
              const habitsWithCompletion = generalHabits.map((habit, index) => ({
                ...habit,
                completed: index % 3 === 0
              }));
              
              this.habits = habitsWithCompletion;
              this.filteredHabits = [...habitsWithCompletion];
              this.loading = false;
              this.loader.hide();
              this.updateStatistics();
              console.log('Using general habits with simulated completion');
            },
            error: (error) => {
              console.error('Error loading general habits:', error);
              this.error = 'Error al cargar hábitos generales';
              this.loading = false;
              this.loader.hide();
            }
          });
        }
      },
      error: (error) => {
        console.error('Error loading user habits:', error);
        
        this.habitService.getAllAvailableHabits().subscribe({
          next: (generalHabits) => {
            console.log('Loaded general habits as fallback:', generalHabits);
            
            const habitsWithCompletion = generalHabits.map((habit, index) => ({
              ...habit,
              completed: index % 3 === 0
            }));
            
            this.habits = habitsWithCompletion;
            this.filteredHabits = [...habitsWithCompletion];
            this.loading = false;
            this.loader.hide();
            this.updateStatistics();
          },
          error: (fallbackError) => {
            console.error('Error loading general habits as fallback:', fallbackError);
            this.error = 'Error al cargar hábitos';
            this.loading = false;
            this.loader.hide();
          }
        });
      }
    });
  }

  toggleHabit(habit: Habit) {
    const newCompletedState = !habit.completed;
    
    if (habit.userHabitId) {
      // Usar el servicio para actualizar en el backend
      this.habitService.toggleHabitCompletion(habit, newCompletedState).subscribe({
        next: (updatedHabit) => {
          console.log('Successfully updated habit:', updatedHabit);
          // Actualizar el hábito local con la información del backend
          Object.assign(habit, updatedHabit);
          this.updateStatistics();
          this.applyFilters();
          this.snackBar.open(
            habit.completed ? '¡Hábito completado!' : 'Hábito marcado como pendiente',
            'Cerrar',
            { duration: 2000 }
          );
        },
        error: (error) => {
          console.error('Error al actualizar hábito:', error);
          // Revertir el estado en caso de error
          habit.completed = !newCompletedState;
          this.snackBar.open('Error al actualizar el hábito', 'Cerrar', { duration: 3000 });
        }
      });
    } else {
      // Para hábitos sin userHabitId, usar persistencia local
      habit.completed = newCompletedState;
      habit.completedAt = newCompletedState ? new Date().toISOString() : undefined;
      habit.lastUpdated = new Date().toISOString();
      
      // Guardar en almacenamiento local
      this.habitService.saveCompletedHabitLocally(habit);
      
      this.updateStatistics();
      this.applyFilters();
      this.snackBar.open(
        habit.completed ? '¡Hábito completado!' : 'Hábito marcado como pendiente',
        'Cerrar',
        { duration: 2000 }
      );
    }
  }

  onDelete(habitId: string) {
    const habit = this.habits.find(h => h.id === habitId);
    if (!habit) return;

    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '400px',
      data: { name: habit.name }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.loader.show();
        this.habitService.deleteHabit(habitId).subscribe({
          next: () => {
            this.snackBar.open('Hábito eliminado exitosamente', 'Cerrar', { duration: 3000 });
            this.loadHabits();
            this.loader.hide();
          },
          error: (error) => {
            console.error('Error deleting habit:', error);
            this.snackBar.open('Error al eliminar el hábito', 'Cerrar', { duration: 3000 });
            this.loader.hide();
          }
        });
      }
    });
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  clearFilters() {
    this.searchControl.setValue('');
    this.categoryFilter.setValue('');
    this.statusFilter.setValue('');
  }

  getCategoryIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      'ENERGIA': 'lightbulb',
      'CONSUMO': 'shopping_cart',
      'AGUA': 'water_drop',
      'MOVILIDAD': 'directions_car',
      'RESIDUOS': 'delete'
    };
    return iconMap[category] || 'category';
  }

  getCategoryColor(category: string): string {
    const colorMap: { [key: string]: string } = {
      'ENERGIA': '#ff9800',
      'CONSUMO': '#2196f3',
      'AGUA': '#00bcd4',
      'MOVILIDAD': '#9c27b0',
      'RESIDUOS': '#795548'
    };
    return colorMap[category] || '#757575';
  }

  getCompletionRateColor(): string {
    if (this.completionRate >= 80) return '#4caf50';
    if (this.completionRate >= 50) return '#ff9800';
    return '#f44336';
  }

  // Sincronizar hábitos con el almacenamiento local
  private syncHabitsWithLocalStorage(habits: Habit[]): Habit[] {
    const completedHabits = this.habitService.getCompletedHabitsForCurrentUser();
    
    return habits.map(habit => {
      const localHabit = completedHabits.find(h => h.id === habit.id);
      if (localHabit && localHabit.completed) {
        return {
          ...habit,
          completed: localHabit.completed,
          completedAt: localHabit.completedAt,
          lastUpdated: localHabit.lastUpdated
        };
      }
      return habit;
    });
  }
}
