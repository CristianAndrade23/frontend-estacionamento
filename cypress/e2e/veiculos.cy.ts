const dialog = () => cy.get('dialog[open]');
const marcas = () => cy.get('table[aria-label="Marcas"] tbody');
const modelos = () => cy.get('table[aria-label="Modelos"] tbody');

describe('Marcas e modelos', () => {
  beforeEach(() => cy.visitAs('admin', '/painel/veiculos'));

  it('cria, impede nome repetido e exclui uma marca', () => {
    cy.contains('button', 'Nova marca').click();
    cy.openDialog().find('input').type('BYD');
    dialog().contains('button', 'Salvar').click();
    cy.toast('Marca BYD salva.');
    marcas().contains('tr', 'BYD').should('contain', '0');

    cy.contains('button', 'Nova marca').click();
    cy.openDialog().find('input').type('chevrolet');
    dialog().contains('button', 'Salvar').click();
    dialog().contains('.field__error', 'Já existe um cadastro com esse nome');
    dialog().contains('button', 'Cancelar').click();

    cy.get('[aria-label="Excluir BYD"]').click();
    cy.openDialog().contains('button', 'Excluir').click();
    cy.toast('Marca BYD excluída.');
    marcas().should('not.contain', 'BYD');
  });

  it('não exclui uma marca que tem modelos', () => {
    cy.get('[aria-label="Excluir Chevrolet"]').click();
    cy.openDialog().contains('button', 'Excluir').click();
    cy.get('.toast--error').should('contain', 'exclua-os antes');
    marcas().should('contain', 'Chevrolet');
  });

  it('cria um modelo e filtra por marca', () => {
    cy.contains('button', 'Novo modelo').click();
    cy.openDialog().within(() => {
      cy.get('#modelo-marca').select('Fiat');
      cy.get('#modelo-nome').type('Pulse');
      cy.contains('.choice', 'Carro').find('input').should('be.checked');
    });
    dialog().contains('button', 'Salvar').click();
    cy.toast('Modelo Pulse salvo.');

    cy.get('select[aria-label="Filtrar por marca"]').select('Fiat');
    // Fiat tem Argo, Mobi, Strada e Toro no seed, mais o Pulse.
    modelos().find('tr').should('have.length', 5).and('not.contain', 'Chevrolet');
    modelos().contains('tr', 'Pulse').should('contain', 'Carro');
  });

  it('edita o tipo de um modelo e busca sem acento', () => {
    cy.get('input[aria-label="Buscar modelo"]').type('hilux');
    modelos().find('tr').should('have.length', 1).and('contain', 'Toyota');
    cy.get('[aria-label="Editar Hilux"]').click();
    cy.openDialog().contains('.choice', 'Carro').click();
    dialog().contains('button', 'Salvar').click();
    cy.toast('Modelo Hilux salvo.');
    modelos().contains('tr', 'Hilux').should('contain', 'Carro');
  });
});
