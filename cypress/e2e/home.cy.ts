import { brl, numero } from '../support/util';

interface Dashboard {
  vagas: number;
  livres: number;
  entradasHoje: number;
  faturamentoHoje: number;
  entradasPorHoraHoje: number[];
  caixa: { abertoPor: string } | null;
}

describe('Tela inicial', () => {
  it('mostra a ocupação e o movimento de hoje', () => {
    cy.visitAs('admin', '/painel');
    cy.api<Dashboard>('GET', '/dashboard').then((d) => {
      cy.contains('.kpi', 'Vagas livres').should('contain', d.livres).and('contain', `de ${d.vagas}`);
      cy.contains('.kpi', 'Entradas hoje').find('.kpi__value').should('have.text', numero(d.entradasHoje));
      cy.contains('.kpi', 'Faturamento hoje').invoke('text').should('match', brl(d.faturamentoHoje));
      cy.contains('.card', 'Caixa').should('contain', 'Aberto').and('contain', d.caixa!.abertoPor);
      // Das 6h (ou da primeira hora com entradas, se antes) até as 23h.
      const primeira = d.entradasPorHoraHoje.findIndex((v) => v > 0);
      const inicio = primeira === -1 ? 6 : Math.min(6, primeira);
      cy.contains('.card', 'Entradas por hora hoje')
        .find('.chart__slot')
        .should('have.length', 24 - inicio);
    });
  });

  it('navega pelo menu e pelos atalhos', () => {
    cy.visitAs('admin', '/painel');
    cy.navigateTo('Pátio');
    cy.contains('h1', 'Pátio');
    cy.title().should('eq', 'Pátio · Estaciona');
    cy.navigateTo('Início');
    cy.contains('.card', 'Caixa').contains('a', 'Ver caixa').click();
    cy.contains('h1', 'Caixa');
  });
});
