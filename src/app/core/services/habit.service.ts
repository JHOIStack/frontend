import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, map, of } from 'rxjs';
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
  private readonly userHabitsKey = 'smarthabits_user_habits';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('HabitService initialized with API URL:', this.apiUrl);
    
    // Exponer métodos de debug en window para facilitar debugging
    if (typeof window !== 'undefined') {
      (window as any).debugHabitService = () => {
        this.debugLocalStorage();
      };
      
      // Método para probar guardado directo - VERSIÓN SIMPLE
      (window as any).testSaveHabit = () => {
        console.log('🧪 TEST: Guardando hábito de prueba...');
        const testHabit = {
          id: 'test-' + Date.now(),
          name: 'Hábito de Prueba',
          category: 'ENERGIA',
          description: 'Prueba',
          completed: false,
          lastUpdated: new Date().toISOString()
        };
        
        const key = 'smarthabits_habits';
        let habits = [];
        
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            habits = JSON.parse(stored);
          }
          habits.push(testHabit);
          localStorage.setItem(key, JSON.stringify(habits));
          console.log('✅ TEST: Guardado exitoso. Total:', habits.length);
          
          // Verificar
          const check = localStorage.getItem(key);
          if (check) {
            const parsed = JSON.parse(check);
            console.log('✅ TEST: Verificado. Total:', parsed.length);
          }
        } catch (e) {
          console.error('❌ TEST: Error:', e);
        }
      };
      
      // Método para ver todas las claves de localStorage
      (window as any).showAllLocalStorage = () => {
        console.log('📋 TODAS LAS CLAVES EN LOCALSTORAGE:');
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const value = localStorage.getItem(key);
            console.log(`${i + 1}. ${key}:`, value ? (value.length > 150 ? value.substring(0, 150) + '...' : value) : 'null');
          }
        }
      };
      
      // Método para verificar específicamente smarthabits_habits
      (window as any).checkHabits = () => {
        const key = 'smarthabits_habits';
        const stored = localStorage.getItem(key);
        console.log('🔍 Verificando:', key);
        console.log('¿Existe?:', !!stored);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            console.log('✅ HÁBITOS ENCONTRADOS:', parsed.length);
            console.log('✅ CONTENIDO:', JSON.stringify(parsed, null, 2));
          } catch (e) {
            console.error('❌ Error parseando:', e);
          }
        } else {
          console.error('❌ No hay datos en esa clave');
        }
      };
    }
  }

  // Método de debug para verificar el estado de localStorage
  debugLocalStorage(): void {
    console.log('🔍 === DEBUG HABIT SERVICE ===');
    const storageKey = 'smarthabits_habits';
    console.log('🔍 Clave de almacenamiento:', storageKey);
    
    const stored = localStorage.getItem(storageKey);
    console.log('🔍 ¿Existe la clave?:', !!stored);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log('🔍 ✅ HÁBITOS ENCONTRADOS:', parsed.length);
        console.log('🔍 ✅ CONTENIDO COMPLETO:', JSON.stringify(parsed, null, 2));
        console.log('🔍 ✅ ÚLTIMO HÁBITO:', parsed[parsed.length - 1]);
      } catch (e) {
        console.error('🔍 ❌ Error parseando:', e);
        console.error('🔍 Valor crudo:', stored);
      }
    } else {
      console.warn('🔍 ⚠️ No hay datos en localStorage para la clave:', storageKey);
    }
    
    // Listar TODAS las claves de localStorage
    console.log('🔍 === TODAS LAS CLAVES EN LOCALSTORAGE ===');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        console.log(`  ${i + 1}. ${key}:`, value ? (value.length > 100 ? value.substring(0, 100) + '...' : value) : 'null');
      }
    }
    
    console.log('🔍 === FIN DEBUG ===');
  }

  // Obtener hábitos del usuario (solo desde localStorage, sin API) - SIN AUTENTICACIÓN
  getUserHabits(): Observable<Habit[]> {
    // Usar clave genérica para usuarios no autenticados
    const storageKey = 'smarthabits_habits';
    let habits: Habit[] = [];
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        habits = JSON.parse(stored);
      }
      console.log('📖 LEÍDO:', storageKey, '| Total:', habits.length);
    } catch (error) {
      console.error('❌ Error:', error);
    }
    
    return new Observable(observer => {
      observer.next(habits);
      observer.complete();
    });
  }

  // Obtener todos los hábitos disponibles (solo desde localStorage, sin API) - SIN AUTENTICACIÓN
  getAllAvailableHabits(): Observable<Habit[]> {
    const storageKey = 'smarthabits_habits';
    let habits: Habit[] = [];
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        habits = JSON.parse(stored);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
    
    return new Observable(observer => {
      observer.next(habits);
      observer.complete();
    });
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

  // Obtener un hábito específico (solo desde localStorage, sin API) - SIN AUTENTICACIÓN
  getHabit(id: string): Observable<Habit> {
    const storageKey = 'smarthabits_habits';
    let habits: Habit[] = [];
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        habits = JSON.parse(stored);
      }
      
      const habit = habits.find(h => h.id === id);
      
      if (!habit) {
        return new Observable(observer => {
          observer.error(new Error('Hábito no encontrado'));
          observer.complete();
        });
      }
      
      return new Observable(observer => {
        observer.next(habit);
        observer.complete();
      });
    } catch (error) {
      return new Observable(observer => {
        observer.error(error);
        observer.complete();
      });
    }
  }

  // Crear nuevo hábito - VERSIÓN ULTRA SIMPLE Y DIRECTA
  createHabit(habit: CreateHabitRequest): Observable<Habit> {
    console.log('🚀🚀🚀 CREANDO HÁBITO 🚀🚀🚀');
    console.log('Datos recibidos:', habit);
    
    // Generar ID único
    const habitId = 'habit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    // Crear hábito
    const habitToSave: Habit = {
      id: habitId,
      name: habit.name,
      category: habit.category,
      description: habit.description,
      completed: false,
      lastUpdated: new Date().toISOString()
    };
    
    console.log('Hábito a guardar:', habitToSave);
    
    // GUARDAR DIRECTAMENTE - SIN COMPLICACIONES
    const STORAGE_KEY = 'smarthabits_habits';
    
    // Leer lo que hay
    let currentHabits: any[] = [];
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      console.log('Lo que hay actualmente:', existing);
      if (existing) {
        currentHabits = JSON.parse(existing);
        console.log('Hábitos parseados:', currentHabits.length);
      }
    } catch (e) {
      console.error('Error leyendo:', e);
      currentHabits = [];
    }
    
    // Agregar el nuevo
    console.log('Agregando nuevo hábito...');
    currentHabits.push(habitToSave);
    console.log('Total después de agregar:', currentHabits.length);
    
    // Guardar
    try {
      const jsonData = JSON.stringify(currentHabits);
      console.log('Guardando JSON de', jsonData.length, 'caracteres');
      
      localStorage.setItem(STORAGE_KEY, jsonData);
      console.log('✅ localStorage.setItem EJECUTADO');
      
      // Verificar INMEDIATAMENTE
      const check = localStorage.getItem(STORAGE_KEY);
      if (check) {
        const verified = JSON.parse(check);
        console.log('✅✅✅ VERIFICADO: Se guardaron', verified.length, 'hábitos');
        console.log('✅ Último hábito:', verified[verified.length - 1]);
      } else {
        console.error('❌❌❌ ERROR: No se encontró después de guardar');
      }
    } catch (error) {
      console.error('❌ ERROR al guardar:', error);
    }
    
    return new Observable(observer => {
      observer.next(habitToSave);
      observer.complete();
    });
  }

  // Actualizar hábito (solo en localStorage, sin API) - SIN AUTENTICACIÓN
  updateHabit(id: string, updates: UpdateHabitRequest): Observable<Habit> {
    const storageKey = 'smarthabits_habits';
    let habits: Habit[] = [];
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        habits = JSON.parse(stored);
      }
      
      const habitIndex = habits.findIndex(h => h.id === id);
      
      if (habitIndex === -1) {
        return new Observable(observer => {
          observer.error(new Error('Hábito no encontrado'));
          observer.complete();
        });
      }
      
      // Actualizar el hábito
      const updatedHabit: Habit = {
        ...habits[habitIndex],
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      
      habits[habitIndex] = updatedHabit;
      localStorage.setItem(storageKey, JSON.stringify(habits));
      
      return new Observable(observer => {
        observer.next(updatedHabit);
        observer.complete();
      });
    } catch (error) {
      return new Observable(observer => {
        observer.error(error);
        observer.complete();
      });
    }
  }

  // Eliminar hábito (solo en localStorage, sin API) - SIN AUTENTICACIÓN
  deleteHabit(id: string): Observable<void> {
    const storageKey = 'smarthabits_habits';
    let habits: Habit[] = [];
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        habits = JSON.parse(stored);
      }
      
      habits = habits.filter(h => h.id !== id);
      localStorage.setItem(storageKey, JSON.stringify(habits));
      
      return new Observable(observer => {
        observer.next();
        observer.complete();
      });
    } catch (error) {
      return new Observable(observer => {
        observer.error(error);
        observer.complete();
      });
    }
  }

  // Marcar hábito como completado/pendiente (solo en localStorage, sin API) - SIN AUTENTICACIÓN
  toggleHabitCompletion(habit: Habit, completed: boolean): Observable<Habit> {
    const storageKey = 'smarthabits_habits';
    let habits: Habit[] = [];
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        habits = JSON.parse(stored);
      }
      
      const habitIndex = habits.findIndex(h => h.id === habit.id);
      
      if (habitIndex === -1) {
        return new Observable(observer => {
          observer.error(new Error('Hábito no encontrado'));
          observer.complete();
        });
      }
      
      // Actualizar el estado de completado
      const updatedHabit: Habit = {
        ...habits[habitIndex],
        completed: completed,
          completedAt: completed ? new Date().toISOString() : undefined,
          lastUpdated: new Date().toISOString()
        };
        
      habits[habitIndex] = updatedHabit;
      localStorage.setItem(storageKey, JSON.stringify(habits));
      
      return new Observable(observer => {
        observer.next(updatedHabit);
        observer.complete();
      });
    } catch (error) {
      return new Observable(observer => {
        observer.error(error);
        observer.complete();
      });
    }
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

  // ===== MÉTODOS PARA GUARDAR TODOS LOS HÁBITOS DEL USUARIO =====

  // Guardar un hábito en localStorage (para todos los hábitos del usuario)
  saveHabitToLocalStorage(habit: Habit): void {
    console.log('🔵 INICIO saveHabitToLocalStorage');
    console.log('🔵 Hábito recibido:', JSON.stringify(habit, null, 2));
    
    try {
      const currentUser = this.authService.getUser();
      console.log('🔵 Usuario actual:', currentUser);
      
      if (!currentUser) {
        console.error('❌ No hay usuario autenticado, no se puede guardar en localStorage');
        console.log('🔵 Verificando localStorage para user_data...');
        const userData = localStorage.getItem('user_data');
        console.log('🔵 user_data en localStorage:', userData);
        return;
      }

      if (!currentUser.id) {
        console.error('❌ Usuario no tiene ID:', currentUser);
        return;
      }

      // Validar que el hábito tenga los datos necesarios
      if (!habit) {
        console.error('❌ Hábito es null o undefined');
        return;
      }
      
      if (!habit.id) {
        console.error('❌ Hábito no tiene ID:', habit);
        return;
      }

      const storageKey = `${this.userHabitsKey}_${currentUser.id}`;
      console.log('🔵 Storage key:', storageKey);
      
      const userHabits = this.getUserHabitsFromStorage(storageKey);
      console.log('🔵 Hábitos actuales en localStorage:', userHabits);
      console.log('🔵 Cantidad de hábitos actuales:', userHabits.length);
      
      // Verificar si el hábito ya existe
      const existingIndex = userHabits.findIndex(h => h.id === habit.id);
      console.log('🔵 Índice del hábito existente:', existingIndex);
      
      if (existingIndex >= 0) {
        // Actualizar hábito existente
        userHabits[existingIndex] = habit;
        console.log('✅ Hábito actualizado en localStorage');
      } else {
        // Agregar nuevo hábito
        userHabits.push(habit);
        console.log('✅ Nuevo hábito agregado a localStorage');
      }

      console.log('🔵 Guardando en localStorage con key:', storageKey);
      console.log('🔵 Datos a guardar:', JSON.stringify(userHabits, null, 2));
      console.log('🔵 Tipo de datos:', typeof userHabits);
      console.log('🔵 Es array?:', Array.isArray(userHabits));
      
      // Intentar guardar
      try {
        const dataToSave = JSON.stringify(userHabits);
        console.log('🔵 String a guardar (primeros 200 chars):', dataToSave.substring(0, 200));
        
        localStorage.setItem(storageKey, dataToSave);
        console.log('🔵 localStorage.setItem ejecutado');
        
        // Verificar inmediatamente
        const immediateCheck = localStorage.getItem(storageKey);
        console.log('🔵 Verificación inmediata (primeros 200 chars):', immediateCheck ? immediateCheck.substring(0, 200) : 'NULL');
        
        if (!immediateCheck) {
          console.error('❌ ERROR CRÍTICO: localStorage.setItem no guardó nada');
          console.error('❌ Storage key usada:', storageKey);
          console.error('❌ Datos intentados:', dataToSave);
          return;
        }
        
        console.log('✅ Hábito guardado exitosamente en localStorage:', {
          id: habit.id,
          name: habit.name,
          category: habit.category,
          description: habit.description,
          totalHabits: userHabits.length,
          storageKey: storageKey
        });
        
        // Verificar que se guardó correctamente
        const verify = localStorage.getItem(storageKey);
        if (verify) {
          const parsed = JSON.parse(verify);
          console.log('✅ VERIFICACIÓN: hábitos en localStorage:', parsed.length);
          console.log('✅ VERIFICACIÓN: contenido completo:', JSON.stringify(parsed, null, 2));
          
          // Verificar que el hábito está en el array
          const habitFound = parsed.find((h: Habit) => h.id === habit.id);
          if (habitFound) {
            console.log('✅ VERIFICACIÓN: El hábito está en el array guardado');
          } else {
            console.error('❌ ERROR: El hábito NO está en el array guardado');
          }
        } else {
          console.error('❌ ERROR: No se pudo verificar el guardado - localStorage.getItem retornó null');
        }
      } catch (saveError) {
        console.error('❌ ERROR al ejecutar localStorage.setItem:', saveError);
        console.error('❌ Tipo de error:', typeof saveError);
        console.error('❌ Mensaje:', saveError instanceof Error ? saveError.message : 'No message');
        throw saveError;
      }
      
      // Listar todas las claves de localStorage para debugging
      console.log('🔵 Todas las claves en localStorage:');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('smarthabits')) {
          console.log(`  - ${key}:`, localStorage.getItem(key));
        }
      }
    } catch (error) {
      console.error('❌ Error guardando hábito en localStorage:', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack available');
    }
    
    console.log('🔵 FIN saveHabitToLocalStorage');
  }

  // Obtener todos los hábitos del usuario desde localStorage
  getUserHabitsFromStorage(storageKey: string): Habit[] {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error leyendo hábitos del usuario desde localStorage:', error);
      return [];
    }
  }

  // Obtener todos los hábitos del usuario actual desde localStorage
  getAllUserHabitsFromLocalStorage(): Habit[] {
    const currentUser = this.authService.getUser();
    if (!currentUser) return [];

    const storageKey = `${this.userHabitsKey}_${currentUser.id}`;
    return this.getUserHabitsFromStorage(storageKey);
  }

  // Guardar múltiples hábitos en localStorage (fusiona con los existentes)
  saveUserHabitsToLocalStorage(habits: Habit[]): void {
    try {
      const currentUser = this.authService.getUser();
      if (!currentUser) {
        console.warn('No hay usuario autenticado, no se pueden guardar hábitos');
        return;
      }

      const storageKey = `${this.userHabitsKey}_${currentUser.id}`;
      const existingHabits = this.getUserHabitsFromStorage(storageKey);
      
      // Fusionar hábitos: los de la API tienen prioridad, pero mantener los que solo están en localStorage
      const mergedHabits: Habit[] = [...habits];
      
      // Agregar hábitos que están en localStorage pero no en la API
      existingHabits.forEach(existingHabit => {
        const existsInApi = habits.some(h => h.id === existingHabit.id);
        if (!existsInApi) {
          mergedHabits.push(existingHabit);
          console.log('Manteniendo hábito de localStorage que no está en API:', existingHabit.name);
        }
      });
      
      localStorage.setItem(storageKey, JSON.stringify(mergedHabits));
      console.log('✅ Hábitos fusionados guardados en localStorage:', {
        fromAPI: habits.length,
        fromLocalStorage: existingHabits.length - habits.length,
        total: mergedHabits.length
      });
    } catch (error) {
      console.error('❌ Error guardando hábitos en localStorage:', error);
    }
  }

  // Eliminar hábito del almacenamiento local de hábitos del usuario
  removeHabitFromUserHabitsLocalStorage(habitId: string): void {
    try {
      const currentUser = this.authService.getUser();
      if (!currentUser) return;

      const storageKey = `${this.userHabitsKey}_${currentUser.id}`;
      const userHabits = this.getUserHabitsFromStorage(storageKey);
      
      const filteredHabits = userHabits.filter(h => h.id !== habitId);
      
      localStorage.setItem(storageKey, JSON.stringify(filteredHabits));
      console.log('Hábito eliminado de localStorage:', habitId);
    } catch (error) {
      console.error('Error eliminando hábito de localStorage:', error);
    }
  }
}
