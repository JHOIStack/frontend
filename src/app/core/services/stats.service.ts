import { Injectable } from '@angular/core';
import { Observable, map, switchMap, of } from 'rxjs';
import { HabitService, Habit } from './habit.service';

export interface UserStats {
  totalHabits: number;
  completedToday: number;
  pendingToday: number;
  currentStreak: number;
  totalCompleted: number;
  completionRate: number;
}

export interface CategoryStats {
  category: string;
  count: number;
  completed: number;
  percentage: number;
}

export interface Stats {
  userStats: UserStats;
  categoryStats: CategoryStats[];
  weeklyProgress: { date: string; completed: number; total: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {

  constructor(private habitService: HabitService) {}

  // Obtener todas las estadísticas (método principal)
  getStats(): Observable<Stats> {
    return this.habitService.getUserHabits().pipe(
      switchMap(userHabits => {
        console.log('StatsService: Processing user habits:', userHabits);
        
        if (userHabits.length > 0) {
          // Si hay hábitos específicos del usuario, usarlos
          const stats = this.calculateStatsFromHabits(userHabits);
          console.log('StatsService: Calculated stats from user habits:', stats);
          return of(stats);
        } else {
          // Si no hay hábitos específicos, usar hábitos generales
          return this.habitService.getAllAvailableHabits().pipe(
            map(generalHabits => {
              console.log('StatsService: Using general habits:', generalHabits);
              // Simular que algunos hábitos están completados para demostración
              const habitsWithCompletion = generalHabits.map((habit, index) => ({
                ...habit,
                completed: index % 3 === 0 // Cada tercer hábito está completado
              }));
              const stats = this.calculateStatsFromHabits(habitsWithCompletion);
              console.log('StatsService: Calculated stats from general habits:', stats);
              return stats;
            })
          );
        }
      })
    );
  }

  // Obtener estadísticas generales del usuario
  getUserStats(): Observable<UserStats> {
    return this.habitService.getUserHabits().pipe(
      switchMap(userHabits => {
        if (userHabits.length > 0) {
          return of(this.calculateUserStats(userHabits));
        } else {
          return this.habitService.getAllAvailableHabits().pipe(
            map(generalHabits => {
              const habitsWithCompletion = generalHabits.map((habit, index) => ({
                ...habit,
                completed: index % 3 === 0
              }));
              return this.calculateUserStats(habitsWithCompletion);
            })
          );
        }
      })
    );
  }

  // Obtener streak actual
  getCurrentStreak(): Observable<number> {
    return this.habitService.getUserHabits().pipe(
      switchMap(userHabits => {
        if (userHabits.length > 0) {
          return of(this.calculateCurrentStreak(userHabits));
        } else {
          return this.habitService.getAllAvailableHabits().pipe(
            map(generalHabits => {
              const habitsWithCompletion = generalHabits.map((habit, index) => ({
                ...habit,
                completed: index % 3 === 0
              }));
              return this.calculateCurrentStreak(habitsWithCompletion);
            })
          );
        }
      })
    );
  }

  // Obtener estadísticas por categoría
  getCategoryStats(): Observable<CategoryStats[]> {
    return this.habitService.getUserHabits().pipe(
      switchMap(userHabits => {
        if (userHabits.length > 0) {
          return of(this.calculateCategoryStats(userHabits));
        } else {
          return this.habitService.getAllAvailableHabits().pipe(
            map(generalHabits => {
              const habitsWithCompletion = generalHabits.map((habit, index) => ({
                ...habit,
                completed: index % 3 === 0
              }));
              return this.calculateCategoryStats(habitsWithCompletion);
            })
          );
        }
      })
    );
  }

  // Obtener hábitos completados hoy
  getCompletedToday(): Observable<Habit[]> {
    return this.habitService.getUserHabits().pipe(
      switchMap(userHabits => {
        if (userHabits.length > 0) {
          return of(userHabits.filter(habit => habit.completed));
        } else {
          return this.habitService.getAllAvailableHabits().pipe(
            map(generalHabits => {
              const habitsWithCompletion = generalHabits.map((habit, index) => ({
                ...habit,
                completed: index % 3 === 0
              }));
              return habitsWithCompletion.filter(habit => habit.completed);
            })
          );
        }
      })
    );
  }

  // Obtener hábitos pendientes hoy
  getPendingToday(): Observable<Habit[]> {
    return this.habitService.getUserHabits().pipe(
      switchMap(userHabits => {
        if (userHabits.length > 0) {
          return of(userHabits.filter(habit => !habit.completed));
        } else {
          return this.habitService.getAllAvailableHabits().pipe(
            map(generalHabits => {
              const habitsWithCompletion = generalHabits.map((habit, index) => ({
                ...habit,
                completed: index % 3 === 0
              }));
              return habitsWithCompletion.filter(habit => !habit.completed);
            })
          );
        }
      })
    );
  }

  // Calcular estadísticas desde un array de hábitos
  private calculateStatsFromHabits(habits: Habit[]): Stats {
    const userStats = this.calculateUserStats(habits);
    const categoryStats = this.calculateCategoryStats(habits);
    const weeklyProgress = this.generateWeeklyProgress(habits);

    return {
      userStats,
      categoryStats,
      weeklyProgress
    };
  }

  // Calcular estadísticas del usuario
  private calculateUserStats(habits: Habit[]): UserStats {
    const totalHabits = habits.length;
    const completedToday = habits.filter(h => h.completed).length;
    const pendingToday = totalHabits - completedToday;
    const completionRate = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;
    const currentStreak = this.calculateCurrentStreak(habits);

    // Obtener estadísticas adicionales del almacenamiento local
    const completedStats = this.habitService.getCompletedHabitsStats();

    return {
      totalHabits,
      completedToday: completedStats.today > 0 ? completedStats.today : completedToday,
      pendingToday: totalHabits - (completedStats.today > 0 ? completedStats.today : completedToday),
      currentStreak,
      totalCompleted: completedStats.total > 0 ? completedStats.total : completedToday,
      completionRate: Math.round(completionRate)
    };
  }

  // Calcular streak actual (simplificado)
  private calculateCurrentStreak(habits: Habit[]): number {
    // Por ahora, calculamos un streak basado en hábitos completados hoy
    const completedToday = habits.filter(h => h.completed).length;
    const totalHabits = habits.length;

    if (totalHabits === 0) return 0;

    // Si completó más del 80% de sus hábitos hoy, consideramos que mantiene el streak
    const completionRate = (completedToday / totalHabits) * 100;

    // Simulamos un streak basado en la tasa de completación
    if (completionRate >= 80) {
      return Math.floor(Math.random() * 10) + 5; // Streak entre 5-15 días
    } else if (completionRate >= 50) {
      return Math.floor(Math.random() * 5) + 1; // Streak entre 1-5 días
    } else {
      return 0; // Sin streak
    }
  }

  // Calcular estadísticas por categoría
  private calculateCategoryStats(habits: Habit[]): CategoryStats[] {
    const categoryMap = new Map<string, { count: number; completed: number }>();

    habits.forEach(habit => {
      const category = habit.category;
      const current = categoryMap.get(category) || { count: 0, completed: 0 };

      current.count++;
      if (habit.completed) {
        current.completed++;
      }

      categoryMap.set(category, current);
    });

    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      count: stats.count,
      completed: stats.completed,
      percentage: stats.count > 0 ? Math.round((stats.completed / stats.count) * 100) : 0
    }));
  }

  // Generar progreso semanal (simulado)
  private generateWeeklyProgress(habits: Habit[]): { date: string; completed: number; total: number }[] {
    const totalHabits = habits.length;
    const today = new Date();

    // Generar datos de la última semana
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Simular datos basados en el día de la semana
      const dayOfWeek = date.getDay();
      let completed = 0;

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Fin de semana - menos completados
        completed = Math.floor(totalHabits * 0.3);
      } else {
        // Día de semana - más completados
        completed = Math.floor(totalHabits * 0.7);
      }

      weekData.push({
        date: date.toISOString().split('T')[0],
        completed,
        total: totalHabits
      });
    }

    return weekData;
  }
}
