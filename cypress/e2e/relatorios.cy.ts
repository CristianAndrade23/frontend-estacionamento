import { brl, numero, periodoDoPreset } from '../support/util';

const kpi = (label: string) => cy.contains('.kpi', label).find('.kpi__value');

describe('Relatórios', () => {
  it('operacional: indicadores e gráficos acompanham o período', () => {
    cy.visitAs('admin', '/painel/relatorios/operacional');
    const mes = periodoDoPreset('30d');
    cy.api<{ entradas: number; porDia: unknown[] }>(
      'GET',
      `/relatorios/operacional?de=${mes.de}&ate=${mes.ate}`,
    ).then((r) => {
      kpi('Entradas').should('have.text', numero(r.entradas));
      cy.contains('.card', 'Entradas por dia').find('.chart__slot').should('have.length', r.porDia.length);
    });

    const semana = periodoDoPreset('7d');
    cy.api<{ entradas: number }>('GET', `/relatorios/operacional?de=${semana.de}&ate=${semana.ate}`).then(
      (r) => {
        cy.contains('.segmented button', 'Últimos 7 dias').click();
        kpi('Entradas').should('have.text', numero(r.entradas));
        cy.contains('.card', 'Entradas por dia').find('.chart__slot').should('have.length', 7);
      },
    );

    // Cada gráfico tem a tabela com os dados.
    cy.contains('.card', 'Por tipo de veículo').find('summary').click();
    cy.contains('.card', 'Por tipo de veículo').find('.chart__table tbody tr').should('have.length', 3);
  });

  it('operacional: intervalo personalizado', () => {
    cy.visitAs('admin', '/painel/relatorios/operacional');
    const { ate } = periodoDoPreset('hoje');
    cy.contains('.segmented button', 'Personalizado').click();
    cy.get('input[name=de]').type(ate);
    cy.contains('.card', 'Entradas por dia').find('.chart__slot').should('have.length', 1);
  });

  it('financeiro: receita bruta, taxas e líquida', () => {
    cy.visitAs('admin', '/painel/relatorios/financeiro');
    const mes = periodoDoPreset('mes');
    cy.api<{ receitaBruta: number; taxas: number; receitaLiquida: number }>(
      'GET',
      `/relatorios/financeiro?de=${mes.de}&ate=${mes.ate}`,
    ).then((r) => {
      kpi('Receita bruta').invoke('text').should('match', brl(r.receitaBruta));
      kpi('Taxas de cartão').invoke('text').should('match', brl(r.taxas));
      kpi('Receita líquida').invoke('text').should('match', brl(r.receitaLiquida));
      cy.contains('.card', 'Demonstrativo')
        .find('tfoot')
        .invoke('text')
        .should('match', brl(r.receitaLiquida));
    });
  });

  it('equipe: aniversariantes do mês', () => {
    cy.visitAs('admin', '/painel/relatorios/equipe');
    cy.api<{ nascimento: string }[]>('GET', '/funcionarios').then((lista) => {
      const mes = String(new Date().getMonth() + 1).padStart(2, '0');
      const doMes = lista.filter((f) => f.nascimento.slice(5, 7) === mes).length;
      kpi('Funcionários').should('have.text', String(lista.length));
      kpi('Aniversariantes do mês').should('have.text', String(doMes));
      cy.get('.aniversariantes tbody tr').should('have.length', doMes);
    });
  });
});
