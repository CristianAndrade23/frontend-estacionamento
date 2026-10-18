import { brl, periodoDoPreset } from '../support/util';

interface Caixa {
  totalRecebido: number;
  saidas: number;
}

describe('Caixa', () => {
  beforeEach(() => cy.visitAs('admin', '/painel/caixa'));

  it('mostra o caixa aberto com os totais por forma de pagamento', () => {
    cy.api<Caixa>('GET', '/caixas/atual').then((caixa) => {
      cy.contains('h2', 'Caixa aberto');
      cy.contains('.details dd', brl(caixa.totalRecebido));
      cy.get('table[aria-label="Recebido por forma de pagamento"] tbody tr').should('have.length', 4);
      cy.get('table[aria-label="Recebido por forma de pagamento"] tfoot').should('contain', caixa.saidas);
    });
  });

  it('fecha o caixa com conferência e abre um novo turno', () => {
    cy.contains('button', 'Fechar caixa').click();
    cy.openDialog().should('contain', 'Confira os valores').contains('button', 'Fechar caixa').click();
    cy.toast('Caixa fechado');
    cy.contains('h2', 'Caixa fechado');

    cy.get('#troco').clear().type('-5');
    cy.contains('button', 'Abrir caixa').click();
    cy.contains('.field__error', 'O troco não pode ser negativo');

    cy.get('#troco').clear().type('200');
    cy.contains('button', 'Abrir caixa').click();
    cy.toast('Caixa aberto');
    cy.contains('h2', 'Caixa aberto');
    cy.contains('.details dd', brl(200));
  });

  it('lista o histórico de caixas do período', () => {
    const semana = periodoDoPreset('7d');
    cy.api<Caixa[]>('GET', `/caixas?de=${semana.de}&ate=${semana.ate}`).then((caixas) => {
      cy.get('.historico tbody tr').should('have.length', caixas.length);
      const total = caixas.reduce((s, c) => s + c.totalRecebido, 0);
      cy.get('.historico tfoot').invoke('text').should('match', brl(total));
    });

    const mes = periodoDoPreset('30d');
    cy.api<Caixa[]>('GET', `/caixas?de=${mes.de}&ate=${mes.ate}`).then((caixas) => {
      cy.contains('.segmented button', 'Últimos 30 dias').click();
      cy.get('.historico tbody tr').should('have.length', caixas.length);
    });
  });
});
