/**
 * Configuração da aplicação.
 * - apiUrl: prefixo das chamadas REST. Em desenvolvimento o `ng serve` encaminha para a API
 *   Spring Boot (proxy.conf.json); em produção o próprio backend entrega o Angular.
 */
export const appSettings = {
  apiUrl: '/api',
  demoCredentials: {
    admin: { username: 'admin', password: 'admin123' },
    operador: { username: 'operador', password: 'operador123' },
  },
} as const;
