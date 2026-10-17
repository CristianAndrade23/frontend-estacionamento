/// <reference types="cypress" />

/**
 * Comandos customizados. Os testes rodam contra o backend real (Spring Boot servindo o build do
 * Angular). Antes de cada teste os dados voltam ao estado inicial via POST /api/demo/reset, e os
 * valores esperados são lidos da própria API (`cy.api`) em vez de ficarem fixos nos testes.
 */

type Perfil = 'admin' | 'operador';

const SENHAS: Record<Perfil, string> = { admin: 'admin123', operador: 'operador123' };
const tokens: Partial<Record<Perfil, unknown>> = {};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Entra pela tela de login, como um usuário faria. */
      loginViaUi(username?: string, password?: string): Chainable<void>;
      /** Abre uma rota já autenticado (sessão gravada antes do app carregar). */
      visitAs(perfil: Perfil, path?: string): Chainable<void>;
      /** Chamada autenticada à API (como admin, salvo indicação). */
      api<T = unknown>(method: string, url: string, body?: unknown, perfil?: Perfil): Chainable<T>;
      /** Clica num item do menu lateral. */
      navigateTo(label: string): Chainable<void>;
      /** Modal aberto no momento (<dialog open>). */
      openDialog(): Chainable<JQuery<HTMLDialogElement>>;
      /** Aguarda um toast com o texto informado. */
      toast(text: string | RegExp): Chainable<JQuery<HTMLElement>>;
    }
  }
}

beforeEach(() => {
  cy.request('POST', '/api/demo/reset');
});

/** Login pela API, uma vez por spec: o JWT continua válido depois do reset (mesmo usuário). */
function sessao(perfil: Perfil) {
  if (tokens[perfil]) return cy.wrap(tokens[perfil], { log: false });
  return cy
    .request('POST', '/api/auth/login', { username: perfil, password: SENHAS[perfil] })
    .its('body')
    .then((body) => {
      tokens[perfil] = body;
      return body;
    });
}

Cypress.Commands.add('loginViaUi', (username = 'admin', password = 'admin123') => {
  cy.visit('/login');
  cy.get('#username').type(username);
  cy.get('#password').type(password, { log: false });
  cy.contains('button', 'Entrar').click();
});

Cypress.Commands.add('visitAs', (perfil: Perfil, path = '/painel') => {
  sessao(perfil).then((login) => {
    cy.visit(path, {
      onBeforeLoad: (win) => win.localStorage.setItem('estaciona:sessao', JSON.stringify(login)),
    });
  });
});

Cypress.Commands.add('api', (method: string, url: string, body?: unknown, perfil: Perfil = 'admin') => {
  return sessao(perfil).then((login) =>
    cy
      .request({
        method,
        url: `/api${url}`,
        body,
        headers: { Authorization: `Bearer ${(login as { token: string }).token}` },
      })
      .its('body'),
  );
});

Cypress.Commands.add('navigateTo', (label: string) => {
  cy.get('nav[aria-label="Menu principal"]').contains('a', label).click();
});

Cypress.Commands.add('openDialog', () => cy.get<HTMLDialogElement>('dialog[open]').should('be.visible'));

Cypress.Commands.add('toast', (text: string | RegExp) => cy.contains('.toast', text).should('be.visible'));

export {};
