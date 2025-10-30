import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://faint-veriee-jafas2025-0eb62b72.koyeb.app/users/me';

  constructor(private http: HttpClient, private auth: AuthService) { }

  private getHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getProfile(): Observable<any> {
    // Obtener la información del usuario desde el AuthService
    const currentUser = this.auth.getUser();
    if (currentUser) {
      return new Observable(observer => {
        // Simular delay de red
        setTimeout(() => {
          observer.next(currentUser);
          observer.complete();
        }, 300);
      });
    } else {
      // Si no hay usuario autenticado, intentar obtener del API
      return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() });
    }
  }

  updateProfile(data: any): Observable<any> {
    // Obtener la información actual del usuario
    const currentUser = this.auth.getUser();
    if (currentUser) {
      // Actualizar la información del usuario en el AuthService
      const updatedUser = { ...currentUser, ...data };
      
      return new Observable(observer => {
        // Simular delay de red
        setTimeout(() => {
          // Actualizar el usuario usando el método del AuthService
          this.auth.updateUser(updatedUser);
          observer.next(updatedUser);
          observer.complete();
        }, 300);
      });
    } else {
      // Si no hay usuario autenticado, intentar actualizar en el API
      return this.http.put<any>(this.apiUrl, data, { headers: this.getHeaders() });
    }
  }
}
