import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe, NgIf, NgForOf } from '@angular/common';
import { HabitService, Habit, HabitHistory } from '../../core/services/habit.service';
import { LoaderService } from '../../core/services/loader.service';

@Component({
  selector: 'app-habit-detail',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatSnackBarModule, DatePipe, NgIf, NgForOf],
  templateUrl: './habit-detail.component.html',
  styleUrl: './habit-detail.component.scss'
})
export class HabitDetailComponent implements OnInit {
  habit: Habit | null = null;
  history: HabitHistory[] = [];
  loading = false;
  error: string | null = null;
  habitId: string | null = null;

  constructor(
    private habitService: HabitService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private loader: LoaderService
  ) {}

  ngOnInit() {
    this.habitId = this.route.snapshot.paramMap.get('id');
    if (this.habitId) {
      this.fetchHabit();
      this.fetchHistory();
    }
  }

  fetchHabit() {
    if (!this.habitId) return;
    this.loading = true;
    this.loader.show();
    this.habitService.getHabit(this.habitId).subscribe({
      next: (habit: Habit) => {
        this.habit = habit;
        this.loading = false;
        this.loader.hide();
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Error al cargar hábito';
        this.loading = false;
        this.loader.hide();
      }
    });
  }

  fetchHistory() {
    if (!this.habitId) return;
    this.habitService.getHabitHistory(this.habitId).subscribe({
      next: (history: HabitHistory[]) => {
        this.history = history;
      },
      error: () => {
        this.history = [];
      }
    });
  }

  markAsDone() {
    if (!this.habit) {
      this.snackBar.open('No hay hábito cargado', 'Cerrar', { duration: 3000 });
      return;
    }
    
    this.loader.show();
    this.habitService.markHabitAsDone(this.habit).subscribe({
      next: (updatedHabit) => {
        this.habit = updatedHabit;
        this.snackBar.open('¡Hábito marcado como cumplido!', 'Cerrar', { duration: 2000 });
        this.fetchHistory();
        this.loader.hide();
      },
      error: (err: any) => {
        this.snackBar.open(err.error?.message || 'Error al marcar como cumplido', 'Cerrar', { duration: 3000 });
        this.loader.hide();
      }
    });
  }

  get completionPercentage(): number {
    if (!this.habit || !this.history.length) return 0;
    // Por ahora, calculamos basado en el historial disponible
    return Math.round((this.history.length / 30) * 100); // Asumiendo 30 días
  }

  get calendarDays(): { date: Date; done: boolean }[] {
    if (!this.history) return [];
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const doneDates = this.history.map(h => new Date(h.completedAt).toDateString());
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date, done: doneDates.includes(date.toDateString()) });
    }
    return days;
  }
}
