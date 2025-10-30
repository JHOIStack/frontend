import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface Habit {
  id: string;
  name: string;
  category: string;
  description: string;
  completed?: boolean; // Campo opcional para el frontend
  userHabitId?: string; // ID del userHabit para operaciones
  completedAt?: string; // Fecha y hora de completado
  lastUpdated?: string; // Última actualización
}

export interface UserHabitResponse {
  id: string;
  userId: string;
  habitId: string;
  status: 'ACTIVO' | 'PAUSADO' | 'COMPLETADO' | 'CANCELADO';
  scheduledTime: string;
  completedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    age: number;
    region: string;
    role: string;
  };
  habit: {
    id: string;
    name: string;
    category: string;
    description: string;
  };
}

export interface CreateHabitRequest {
  name: string;
  category: string;
  description: string;
}

export interface UpdateHabitRequest {
  name?: string;
  category?: string;
  description?: string;
  completed?: boolean;
}

export interface HabitHistory {
  id: string;
  habitId: string;
  completedAt: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HabitService {
  private apiUrl = environment.apiUrl;
  private readonly completedHabitsKey = 'smarthabits_completed_habits';
  private readonly habitHistoryKey = 'smarthabits_habit_history';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('HabitService initialized with API URL:', this.apiUrl);
  }

  // Obtener hábitos del usuario
  getUserHabits(): Observable<Habit[]> {
    const currentUser = this.authService.getUser();
    
    if (!currentUser || !currentUser.id) {
      console.error('No authenticated user found');
      return new Observable(observer => {
        observer.error(new Error('No authenticated user found'));
        observer.complete();
      });
    }
    
    const userId = currentUser.id;
    const endpoint = `${this.apiUrl}/api/user-habits/user/${userId}`;
    
    console.log('Fetching user habits from:', endpoint);
    console.log('User ID:', userId);
    
    return this.http.get<UserHabitResponse[]>(endpoint).pipe(
      map(userHabits => {
        console.log('Raw API response:', userHabits);
        
        // Mapear la respuesta de la API a nuestro formato de Habit
        const habits: Habit[] = userHabits.map(userHabit => ({
          id: userHabit.habitId, // Usar habitId como id del hábito
          name: userHabit.habit.name,
          category: userHabit.habit.category, // Corregido: usar habit.category
          description: userHabit.habit.description,
          completed: userHabit.status === 'COMPLETADO' || userHabit.completedAt !== null,
          userHabitId: userHabit.id // Guardar el ID del userHabit para operaciones
        }));
        
        console.log('Mapped habits:', habits);
        return habits;
      }),
      tap(habits => {
        console.log('Final habits array:', habits);
      }),
      catchError(error => {
        console.error('Error fetching user habits:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url
        });
        throw error;
      })
    );
  }

  // Método temporal para obtener todos los hábitos disponibles
  getAllAvailableHabits(): Observable<Habit[]> {
    console.log('Fetching all available habits from:', `${this.apiUrl}/api/habits`);
    return this.http.get<Habit[]>(`${this.apiUrl}/api/habits`).pipe(
      tap(habits => {
        console.log('All available habits:', habits);
      }),
      catchError(error => {
        console.error('Error fetching all habits:', error);
        throw error;
      })
    );
  }

  // Obtener todos los hábitos (alias para getUserHabits)
  getHabits(): Observable<Habit[]> {
    return this.getUserHabits();
  }

  // Obtener hábitos de un usuario específico por ID
  getUserHabitsById(userId: string): Observable<Habit[]> {
    const endpoint = `${this.apiUrl}/api/user-habits/user/${userId}`;
    
    console.log('Fetching habits for user ID:', userId);
    console.log('Endpoint:', endpoint);
    
    return this.http.get<UserHabitResponse[]>(endpoint).pipe(
      map(userHabits => {
        console.log('Raw API response for user', userId, ':', userHabits);
        
        const habits: Habit[] = userHabits.map(userHabit => ({
          id: userHabit.habitId,
          name: userHabit.habit.name,
          category: userHabit.habit.category,
          description: userHabit.habit.description,
          completed: userHabit.status === 'COMPLETADO' || userHabit.completedAt !== null,
          userHabitId: userHabit.id
        }));
        
        console.log('Mapped habits for user', userId, ':', habits);
        return habits;
      }),
      catchError(error => {
        console.error('Error fetching habits for user', userId, ':', error);
        throw error;
      })
    );
  }

  // Obtener un hábito específico
  getHabit(id: string): Observable<Habit> {
    return this.http.get<Habit>(`${this.apiUrl}/api/habits/${id}`);
  }

  // Crear nuevo hábito
  createHabit(habit: CreateHabitRequest): Observable<Habit> {
    return this.http.post<Habit>(`${this.apiUrl}/api/habits`, habit);
  }

  // Actualizar hábito
  updateHabit(id: string, updates: UpdateHabitRequest): Observable<Habit> {
    return this.http.put<Habit>(`${this.apiUrl}/api/habits/${id}`, updates).pipe(
      tap(updatedHabit => {
        // Sincronizar con almacenamiento local si el hábito está completado
        if (updatedHabit.completed) {
          this.updateHabitInLocalStorage(updatedHabit);
        }
      })
    );
  }

  // Eliminar hábito
  deleteHabit(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/habits/${id}`).pipe(
      tap(() => {
        // También eliminar del almacenamiento local
        this.removeHabitFromLocalStorage(id);
      })
    );
  }

  // Marcar hábito como completado/pendiente (usando user-habits)
  toggleHabitCompletion(habit: Habit, completed: boolean): Observable<Habit> {
    if (!habit.userHabitId) {
      console.error('No userHabitId found for habit:', habit);
      throw new Error('No userHabitId found for habit');
    }
    
    console.log('Toggling habit completion:', {
      userHabitId: habit.userHabitId,
      completed: completed
    });
    
    return this.http.put<UserHabitResponse>(`${this.apiUrl}/api/user-habits/${habit.userHabitId}`, { 
      completed: completed 
    }).pipe(
      map(response => {
        const updatedHabit = {
          id: response.habitId,
          name: response.habit.name,
          category: response.habit.category,
          description: response.habit.description,
          completed: response.status === 'COMPLETADO' || response.completedAt !== null,
          userHabitId: response.id,
          completedAt: completed ? new Date().toISOString() : undefined,
          lastUpdated: new Date().toISOString()
        };
        
        // Guardar en almacenamiento local
        this.saveCompletedHabitLocally(updatedHabit);
        
        return updatedHabit;
      })
    );
  }

  // Marcar hábito como completado (alias para toggleHabitCompletion)
  markHabitAsDone(habit: Habit): Observable<Habit> {
    return this.toggleHabitCompletion(habit, true);
  }

  // Obtener historial de un hábito
  getHabitHistory(id: string): Observable<HabitHistory[]> {
    return this.http.get<HabitHistory[]>(`${this.apiUrl}/api/habits/${id}/history`);
  }

  // Obtener conteo de hábitos pendientes para hoy
  getPendingHabitsCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/api/user-habits/pending-count`);
  }

  // ===== MÉTODOS DE ALMACENAMIENTO LOCAL =====

  // Guardar hábito completado localmente
  saveCompletedHabitLocally(habit: Habit): void {
    try {
      const currentUser = this.authService.getUser();
      if (!currentUser) return;

      const storageKey = `${this.completedHabitsKey}_${currentUser.id}`;
      const completedHabits = this.getCompletedHabitsFromStorage(storageKey);
      
      if (habit.completed) {
        // Agregar o actualizar hábito completado
        const existingIndex = completedHabits.findIndex(h => h.id === habit.id);
        if (existingIndex >= 0) {
          completedHabits[existingIndex] = habit;
        } else {
          completedHabits.push(habit);
        }
      } else {
        // Remover hábito de completados
        const filteredHabits = completedHabits.filter(h => h.id !== habit.id);
        completedHabits.splice(0, completedHabits.length, ...filteredHabits);
      }

      localStorage.setItem(storageKey, JSON.stringify(completedHabits));
      console.log('Saved completed habits locally:', completedHabits);
    } catch (error) {
      console.error('Error saving completed habits locally:', error);
    }
  }

  // Obtener hábitos completados del almacenamiento local
  private getCompletedHabitsFromStorage(storageKey: string): Habit[] {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading completed habits from storage:', error);
      return [];
    }
  }

  // Obtener hábitos completados para el usuario actual
  getCompletedHabitsForCurrentUser(): Habit[] {
    const currentUser = this.authService.getUser();
    if (!currentUser) return [];

    const storageKey = `${this.completedHabitsKey}_${currentUser.id}`;
    return this.getCompletedHabitsFromStorage(storageKey);
  }

  // Verificar si un hábito está completado hoy
  isHabitCompletedToday(habitId: string): boolean {
    const completedHabits = this.getCompletedHabitsForCurrentUser();
    const habit = completedHabits.find(h => h.id === habitId);
    
    if (!habit || !habit.completedAt) return false;
    
    const completedDate = new Date(habit.completedAt);
    const today = new Date();
    
    return completedDate.toDateString() === today.toDateString();
  }

  // Obtener estadísticas de hábitos completados
  getCompletedHabitsStats(): { today: number; thisWeek: number; total: number } {
    const completedHabits = this.getCompletedHabitsForCurrentUser();
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const todayCount = completedHabits.filter(habit => {
      if (!habit.completedAt) return false;
      const completedDate = new Date(habit.completedAt);
      return completedDate.toDateString() === today.toDateString();
    }).length;

    const weekCount = completedHabits.filter(habit => {
      if (!habit.completedAt) return false;
      const completedDate = new Date(habit.completedAt);
      return completedDate >= startOfWeek && completedDate <= today;
    }).length;

    return {
      today: todayCount,
      thisWeek: weekCount,
      total: completedHabits.length
    };
  }

  // Limpiar hábitos completados antiguos (más de 30 días)
  cleanupOldCompletedHabits(): void {
    const currentUser = this.authService.getUser();
    if (!currentUser) return;

    const storageKey = `${this.completedHabitsKey}_${currentUser.id}`;
    const completedHabits = this.getCompletedHabitsFromStorage(storageKey);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentHabits = completedHabits.filter(habit => {
      if (!habit.completedAt) return false;
      const completedDate = new Date(habit.completedAt);
      return completedDate > thirtyDaysAgo;
    });

    localStorage.setItem(storageKey, JSON.stringify(recentHabits));
    console.log('Cleaned up old completed habits, kept:', recentHabits.length);
  }

  // Eliminar hábito del almacenamiento local
  private removeHabitFromLocalStorage(habitId: string): void {
    try {
      const currentUser = this.authService.getUser();
      if (!currentUser) return;

      const storageKey = `${this.completedHabitsKey}_${currentUser.id}`;
      const completedHabits = this.getCompletedHabitsFromStorage(storageKey);
      
      const filteredHabits = completedHabits.filter(h => h.id !== habitId);
      
      localStorage.setItem(storageKey, JSON.stringify(filteredHabits));
      console.log('Removed habit from local storage:', habitId);
    } catch (error) {
      console.error('Error removing habit from local storage:', error);
    }
  }

  // Actualizar hábito en almacenamiento local
  updateHabitInLocalStorage(updatedHabit: Habit): void {
    try {
      const currentUser = this.authService.getUser();
      if (!currentUser) return;

      const storageKey = `${this.completedHabitsKey}_${currentUser.id}`;
      const completedHabits = this.getCompletedHabitsFromStorage(storageKey);
      
      const existingIndex = completedHabits.findIndex(h => h.id === updatedHabit.id);
      if (existingIndex >= 0) {
        completedHabits[existingIndex] = updatedHabit;
        localStorage.setItem(storageKey, JSON.stringify(completedHabits));
        console.log('Updated habit in local storage:', updatedHabit);
      }
    } catch (error) {
      console.error('Error updating habit in local storage:', error);
    }
  }
}
