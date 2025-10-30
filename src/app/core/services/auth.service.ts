import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  region: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'auth_token';
  private userKey = 'user_data';

  constructor(private http: HttpClient) {
    console.log('AuthService initialized with API URL:', this.apiUrl);
  }

  login(email: string, password: string): Observable<any> {
    console.log('Attempting login for email:', email);
    
    // Lista de usuarios reales con hábitos
    const realUsers: User[] = [
      {
        id: '9c6ed774-cb1c-4e34-8ee6-9316e9ac7315',
        name: 'Jacob',
        email: 'jacob41713@hotmail.com',
        age: 61,
        region: 'SURESTE',
        role: 'COMMON'
      },
      {
        id: 'b124de12-0876-470e-a0b7-59ca9c8d91ad',
        name: 'Velia',
        email: 'velia39705@icloud.com',
        age: 22,
        region: 'CENTRO',
        role: 'COMMON'
      }
    ];
    
    // Buscar si el email coincide con algún usuario existente
    const existingUser = realUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
    
    let realUser: User;
    
    if (existingUser) {
      // Usar el usuario existente
      realUser = { ...existingUser };
      console.log('Found existing user:', realUser);
    } else {
      // Crear un nuevo usuario basado en el email proporcionado
      const displayName = email.split('@')[0]; // Usar la parte antes del @ como nombre de display
      const newUserId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      
      realUser = {
        id: newUserId,
        name: displayName,
        email: email,
        age: 25, // Edad por defecto
        region: 'CENTRO', // Región por defecto
        role: 'COMMON'
      };
      console.log('Created new user:', realUser);
    }

    const mockToken = 'mock-jwt-token-' + Date.now();

    return new Observable(observer => {
      // Simular delay de red
      setTimeout(() => {
        console.log('Login successful for:', email);
        console.log('Real user data:', realUser);
        console.log('Mock token generated:', mockToken);
        
        // Guardar token y datos del usuario
        this.setToken(mockToken);
        this.setUser(realUser);
        
        observer.next({ user: realUser, token: mockToken });
        observer.complete();
      }, 500);
    });
  }

  register(data: { name: string; email: string; age: number; region: string }): Observable<any> {
    console.log('Attempting registration with data:', data);
    
    // Crear un nuevo usuario con los datos proporcionados
    const newUserId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const newUser: User = {
      id: newUserId,
      name: data.name,
      email: data.email,
      age: data.age,
      region: data.region,
      role: 'COMMON'
    };
    
    console.log('Created new user for registration:', newUser);
    
    return new Observable(observer => {
      // Simular delay de red
      setTimeout(() => {
        console.log('Registration successful for:', data.email);
        
        // Generar token mock
        const mockToken = 'mock-jwt-token-' + Date.now();
        
        // Guardar token y datos del usuario
        this.setToken(mockToken);
        this.setUser(newUser);
        
        observer.next({ user: newUser, token: mockToken });
        observer.complete();
      }, 800);
    });
  }

  logout(): void {
    console.log('Logging out user');
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const isAuth = !!token;
    console.log('Checking authentication - Token present:', isAuth);
    return isAuth;
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    console.log('Getting token from localStorage:', token ? 'Present' : 'Missing');
    return token;
  }

  getUser(): User | null {
    const userData = localStorage.getItem(this.userKey);
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('Getting user from localStorage:', user);
        return user;
      } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
      }
    }
    console.log('No user data found in localStorage');
    return null;
  }

  private setToken(token: string): void {
    console.log('Setting token in localStorage:', token.substring(0, 20) + '...');
    localStorage.setItem(this.tokenKey, token);
  }

  private setUser(user: User): void {
    console.log('Setting user in localStorage:', user);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  updateUser(userData: Partial<User>): void {
    const currentUser = this.getUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      this.setUser(updatedUser);
      console.log('Updated user data:', updatedUser);
    }
  }
}
