import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { NotFoundComponent } from './not-found.component';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'auth', loadChildren: () => import('./auth/auth.module').then(m => m.routes) },
  { path: 'dashboard', loadChildren: () => import('./dashboard/dashboard.module').then(m => m.routes), canActivate: [authGuard] },
  { path: 'habits', loadChildren: () => import('./habits/habits.module').then(m => m.routes), canActivate: [authGuard] },
  { path: 'stats', loadChildren: () => import('./stats/stats.module').then(m => m.routes), canActivate: [authGuard] },

  { path: '**', component: NotFoundComponent }
];
