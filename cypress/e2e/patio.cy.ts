import { formatarPlaca } from '../support/util';

interface Pagina {
  total: number;
  itens: { id: number; placa: string; noPatio: boolean }[];
}

const dialog = () => cy.get('dialog[open]');

function abrirEntrada() {
  cy.get('.page-header').contains('button', 'Registrar entrada').click();
  return cy.openDialog();
}

describe('Pátio', () => {
  beforeEach(() => cy.visitAs('admin', '/painel/patio'));

  it('lista os veículos no pátio, paginados', () => {
    cy.api<Pagina>('GET', '/movimentacoes?situacao=PATIO').then(({ total }) => {
      cy.contains('.segmented button', 'No pátio').should('contain', total);
      cy.get('tbody tr').should('have.length', Math.min(10, total));
      cy.contains('.paginator__info', `${total} registros`);
      cy.get('.paginator').contains('button', '2').click();
      cy.get('tbody tr').should('have.length', total - 10);
    });
  });

  it('valida a placa e registra a entrada', () => {
    abrirEntrada().within(() => {
      cy.get('#placa').type('ab12').blur();
      cy.contains('.field__error', 'Placa inválida');
      cy.get('#placa').clear().type('tst1e23').should('have.value', 'TST1E23');
      cy.get('#modelo').select('Onix · Carro');
    });
    dialog().contains('button', 'Registrar entrada').click();

    cy.toast('Entrada de TST1E23 registrada.');
    dialog().should('not.exist');
    cy.contains('tbody tr', 'TST1E23').should('contain', 'Chevrolet Onix').and('contain', 'Até 15 min');
  });

  it('aplica a máscara do padrão antigo e recusa um veículo que já está no pátio', () => {
    cy.api<Pagina>('GET', '/movimentacoes?situacao=PATIO').then(({ itens }) => {
      const placa = itens[0].placa;
      abrirEntrada().within(() => {
        cy.get('#placa').type(placa.toLowerCase()).should('have.value', formatarPlaca(placa));
        cy.get('#modelo').select('Gol · Carro');
      });
      dialog().contains('button', 'Registrar entrada').click();
      dialog().contains('.alert', 'já está no pátio').should('be.visible');
    });
  });

  it('registra a saída com a forma de pagamento', () => {
    cy.api<Pagina>('GET', '/movimentacoes?situacao=PATIO').then(({ total, itens }) => {
      cy.get('tbody tr').first().contains('button', 'Saída').click();
      cy.openDialog().within(() => {
        cy.contains('.plate', formatarPlaca(itens[0].placa));
        cy.contains('Total');
      });
      dialog().contains('button', 'Confirmar pagamento e saída').click();
      dialog().contains('.field__error', 'Selecione a forma de pagamento');

      dialog().contains('.choice', 'Pix').click();
      dialog().contains('button', 'Confirmar pagamento e saída').click();
      cy.toast(new RegExp(`Saída de ${formatarPlaca(itens[0].placa)}: R\\$.* no pix`));
      cy.contains('.segmented button', 'No pátio').should('contain', total - 1);
      cy.get('tbody').should('not.contain', formatarPlaca(itens[0].placa));
    });
  });

  it('bloqueia a saída com o caixa fechado', () => {
    cy.api('POST', '/caixas/fechar');
    cy.reload();
    cy.contains('.alert', 'O caixa está fechado');
    cy.get('tbody tr').first().contains('button', 'Saída').click();
    cy.openDialog().contains('.alert', 'Abra o caixa');
    dialog().contains('button', 'Confirmar pagamento e saída').should('be.disabled');
  });

  it('busca uma placa no histórico', () => {
    cy.api<Pagina>('GET', '/movimentacoes?situacao=TODAS&pagina=4').then(({ itens }) => {
      const finalizada = itens.find((m) => !m.noPatio)!;
      cy.contains('.segmented button', 'Histórico').click();
      cy.get('thead').should('contain', 'Pagamento');
      cy.get('input[type=search]').type(formatarPlaca(finalizada.placa).toLowerCase());
      cy.get('tbody tr').first().should('contain', formatarPlaca(finalizada.placa));
      cy.get('tbody tr').each((tr) => expect(tr.text()).to.contain(formatarPlaca(finalizada.placa)));
    });
  });

  it('abre o formulário de entrada pelo atalho da tela inicial', () => {
    cy.visitAs('admin', '/painel');
    cy.get('.page-header').contains('a', 'Registrar entrada').click();
    cy.location('pathname').should('eq', '/painel/patio');
    cy.openDialog().should('contain', 'Placa');
  });
});
