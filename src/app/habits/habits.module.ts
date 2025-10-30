import { Routes } from '@angular/router';
import { HabitListComponent } from './habit-list/habit-list.component';
import { HabitDetailComponent } from './habit-detail/habit-detail.component';
import { HabitFormComponent } from './habit-form/habit-form.component';

export const routes: Routes = [
  { path: '', component: HabitListComponent },
  { path: 'new', component: HabitFormComponent },
  { path: ':id', component: HabitDetailComponent },
  { path: ':id/edit', component: HabitFormComponent }
];
