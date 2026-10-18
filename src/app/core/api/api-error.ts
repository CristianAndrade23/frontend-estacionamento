import { HttpErrorResponse } from '@angular/common/http';

/** Extrai uma mensagem legível de um erro HTTP (o backend responde `{ message }`). */
export function apiErrorMessage(error: unknown, fallback = 'Não foi possível concluir a operação.'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0 || error.status === 502 || error.status === 504) {
      return 'Não foi possível falar com a API. Ela está rodando? (npm run api)';
    }
    const message = (error.error as { message?: unknown } | null)?.message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}
