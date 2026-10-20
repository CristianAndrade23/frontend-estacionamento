import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import localePt from '@angular/common/locales/pt';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { authInterceptor } from './core/auth/auth.interceptor';
import { demoApiInterceptor } from './core/demo/demo-api.interceptor';

registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        authInterceptor,
        // No modo demo, a API responde dentro do navegador (último da cadeia, no lugar da rede).
        ...(environment.demoApi ? [demoApiInterceptor] : []),
      ]),
    ),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
  ],
};
