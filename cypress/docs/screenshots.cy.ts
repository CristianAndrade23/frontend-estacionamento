/**
 * Gera as imagens do README (`npm run docs:screenshots`). Saem em cypress/screenshots-docs/ e são
 * copiadas para docs/screenshots/. Não faz parte da suíte E2E.
 */

/** Força o tema (prefers-color-scheme) pelo DevTools Protocol, sem depender do tema do sistema. */
const tema = (value: 'light' | 'dark') =>
  // Dentro de cy.then para rodar na fila de comandos, e não quando o teste é montado.
  cy.then(() =>
    Cypress.automation('remote:debugger:protocol', {
      command: 'Emulation.setEmulatedMedia',
      params: { features: [{ name: 'prefers-color-scheme', value }] },
    }),
  );

const foto = (nome: string, { rolarParaOTopo = true } = {}) => {
  if (rolarParaOTopo) cy.window().then((win) => win.scrollTo(0, 0));
  // Tempo para o cross-fade da View Transition do roteador terminar.
  cy.wait(1200);
  // Sem congelar animações: a View Transition da navegação precisa terminar para a página aparecer.
  cy.screenshot(nome, { capture: 'viewport', overwrite: true, disableTimersAndAnimations: false });
};

describe('Screenshots da documentação', () => {
  beforeEach(() => {
    cy.viewport(1440, 900);
    tema('light');
  });

  it('login', () => {
    cy.visit('/login');
    cy.contains('button', 'Entrar');
    foto('login');
  });

  it('início', () => {
    cy.visitAs('admin', '/painel');
    cy.contains('.kpi', 'Vagas livres');
    cy.get('.chart__slot').should('have.length.greaterThan', 0);
    foto('inicio');
    tema('dark');
    foto('inicio-escuro');
  });

  it('pátio e saída', () => {
    cy.visitAs('admin', '/painel/patio');
    cy.get('tbody tr').should('have.length', 10);
    foto('patio');
    cy.get('tbody tr').first().contains('button', 'Saída').click();
    cy.openDialog().contains('Total');
    cy.get('dialog[open]').contains('.choice', 'Pix').click();
    foto('saida');
  });

  it('caixa', () => {
    cy.visitAs('admin', '/painel/caixa');
    cy.contains('h2', 'Caixa aberto');
    cy.get('.historico tbody tr').should('have.length.greaterThan', 1);
    foto('caixa');
  });

  it('relatório financeiro', () => {
    cy.visitAs('admin', '/painel/relatorios/financeiro');
    cy.contains('.segmented button', 'Últimos 30 dias').click();
    cy.get('.chart__slot').should('have.length', 30);
    foto('relatorio-financeiro');
  });

  it('relatório operacional', () => {
    cy.visitAs('admin', '/painel/relatorios/operacional');
    cy.get('.chart__slot').should('have.length.greaterThan', 0);
    foto('relatorio-operacional');
  });

  it('preços', () => {
    cy.visitAs('admin', '/painel/precos');
    cy.get('tbody tr').should('have.length', 3);
    foto('precos');
  });

  it('equipe', () => {
    cy.visitAs('admin', '/painel/equipe');
    cy.get('table[aria-label="Funcionários"] tbody tr').should('have.length.greaterThan', 1);
    foto('equipe');
  });

  it('celular', () => {
    cy.viewport(390, 844);
    cy.visitAs('operador', '/painel/patio');
    cy.get('tbody tr').should('have.length', 10);
    foto('celular');
  });
});
