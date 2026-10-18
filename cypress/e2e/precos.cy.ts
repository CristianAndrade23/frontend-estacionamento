import { brl } from '../support/util';

interface Preco {
  tipo: string;
  ate15: number;
  ate60: number;
  horaAdicional: number;
}

const dialog = () => cy.get('dialog[open]');

describe('Preços', () => {
  it('simula a cobrança com a mesma regra do backend', () => {
    cy.visitAs('admin', '/painel/precos');
    cy.api<Preco[]>('GET', '/precos').then((precos) => {
      const carro = precos.find((p) => p.tipo === 'CARRO')!;
      const moto = precos.find((p) => p.tipo === 'MOTO')!;

      // 1 h 20 = valor de 1 hora + 1 hora adicional.
      cy.get('input[name=sim-horas]').clear().type('1');
      cy.get('input[name=sim-minutos]').clear().type('20');
      cy.get('[data-testid=valor-simulado]')
        .invoke('text')
        .should('match', brl(carro.ate60 + carro.horaAdicional));
      cy.contains('.simulador__resultado', '1 h + 1 h adicional');

      cy.get('select[name=sim-tipo]').select('Moto');
      cy.get('input[name=sim-horas]').clear().type('0');
      cy.get('input[name=sim-minutos]').clear().type('10');
      cy.get('[data-testid=valor-simulado]').invoke('text').should('match', brl(moto.ate15));
    });
  });

  it('o administrador edita uma tabela, com as faixas em ordem crescente', () => {
    cy.visitAs('admin', '/painel/precos');
    cy.get('[aria-label="Editar preços de Moto"]').click();
    cy.openDialog().within(() => {
      cy.get('#preco-ate15').clear().type('7');
      cy.get('#preco-ate30').clear().type('6');
    });
    dialog().contains('button', 'Salvar preços').click();
    dialog().contains('.alert', 'Cada faixa precisa custar pelo menos o mesmo que a anterior.');

    dialog().find('#preco-ate30').clear().type('7.5');
    dialog().contains('button', 'Salvar preços').click();
    cy.toast('Preços de moto atualizados.');
    cy.contains('tbody tr', 'Moto').invoke('text').should('match', brl(7)).and('match', brl(7.5));
  });

  it('o operador só consulta', () => {
    cy.visitAs('operador', '/painel/precos');
    cy.get('tbody tr').should('have.length', 3);
    cy.get('[aria-label^="Editar preços"]').should('not.exist');
    cy.contains('Apenas o administrador pode alterar os preços.');
  });
});
