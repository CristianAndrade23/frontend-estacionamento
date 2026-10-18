import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { appSettings } from '../config';
import { SessionService } from './session.service';

/** Anexa o token JWT às chamadas da API e encerra a sessão quando o backend responde 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);
  const token = session.token();
  const isApi = req.url.startsWith(appSettings.apiUrl);
  const isLogin = req.url.endsWith('/auth/login');

  const request = isApi && token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && isApi && !isLogin) {
        session.logout(true);
      }
      return throwError(() => error);
    }),
  );
};
