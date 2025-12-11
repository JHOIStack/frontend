import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

// Función para asegurar que los iconos de Material se carguen correctamente
export function initializeIcons(): () => Promise<void> {
  return () => {
    return new Promise<void>((resolve) => {
      // Esperar a que las fuentes estén listas
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => resolve()).catch(() => resolve());
      } else {
        // Fallback: resolver inmediatamente si no hay soporte para fonts.ready
        resolve();
      }
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeIcons,
      multi: true
    }
  ]
};
