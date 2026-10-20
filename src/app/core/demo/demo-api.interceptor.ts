import { HttpInterceptorFn } from '@angular/common/http';
import { delay, dematerialize, from, materialize } from 'rxjs';
import { appSettings } from '../config';

/**
 * Modo demo: intercepta as chamadas à API e responde dentro do navegador, simulando latência.
 * A API (`demo-api.ts`, com regras e gerador de dados) é carregada sob demanda, então não pesa
 * no build normal.
 */
export const demoApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(appSettings.apiUrl + '/')) return next(req);

  const caminho = req.url.slice(appSettings.apiUrl.length).split('?')[0];
  return from(import('./demo-api').then((api) => api.responder(req, caminho))).pipe(
    // materialize/dematerialize aplica o atraso também aos erros.
    materialize(),
    delay(120 + Math.random() * 200),
    dematerialize(),
  );
};
