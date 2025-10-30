import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const token = authService.getToken();
  
  console.log('AuthInterceptor - Request URL:', request.url);
  console.log('AuthInterceptor - Token present:', !!token);
  
  if (token) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('AuthInterceptor - Added Authorization header');
  } else {
    console.log('AuthInterceptor - No token found, proceeding without Authorization header');
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('AuthInterceptor - Error occurred:', {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        message: error.message
      });
      
      if (error.status === 401) {
        console.log('AuthInterceptor - 401 Unauthorized, logging out user');
        // Token expirado o inválido
        authService.logout();
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
}; 