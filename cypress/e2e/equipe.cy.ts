interface Funcionario {
  nome: string;
  cpf: string;
  nascimento: string;
}

const dialog = () => cy.get('dialog[open]');
const funcionarios = () => cy.get('table[aria-label="Funcionários"] tbody');

describe('Equipe', () => {
  beforeEach(() => cy.visitAs('admin', '/painel/equipe'));

  it('cadastra um funcionário validando CPF e idade', () => {
    cy.contains('button', 'Novo funcionário').click();
    cy.openDialog().within(() => {
      cy.get('#func-nome').type('Beatriz Nogueira');
      cy.get('#func-cpf').type('11144477700').should('have.value', '111.444.777-00');
      cy.get('#func-funcao').select('Manobrista');
      cy.get('#func-nascimento').type('2012-03-10');
      cy.get('#func-admissao').clear().type('2025-02-01');
    });
    dialog().contains('button', 'Salvar').click();
    dialog().within(() => {
      cy.contains('.field__error', 'CPF inválido');
      cy.contains('.field__error', 'Precisa ter pelo menos 16 anos na admissão');
      cy.get('#func-cpf').clear().type('111.444.777-35');
      cy.get('#func-nascimento').clear().type('1998-03-10');
    });
    dialog().contains('button', 'Salvar').click();

    cy.toast('Funcionário Beatriz salvo.');
    cy.get('input[aria-label="Buscar funcionário"]').type('beatriz');
    funcionarios()
      .find('tr')
      .should('have.length', 1)
      .and('contain', '111.444.777-35')
      .and('contain', 'Manobrista');
  });

  it('busca pelo CPF', () => {
    cy.api<Funcionario[]>('GET', '/funcionarios').then(([primeiro]) => {
      cy.get('input[aria-label="Buscar funcionário"]').type(primeiro.cpf.slice(0, 6));
      funcionarios().should('contain', primeiro.nome);
    });
  });

  it('não exclui uma função atribuída a alguém, mas exclui uma nova', () => {
    cy.get('[aria-label="Excluir Gerente"]').click();
    cy.openDialog().contains('button', 'Excluir').click();
    cy.get('.toast--error').should('contain', 'está atribuída');

    cy.contains('button', 'Nova função').click();
    cy.openDialog().find('input').type('Recepcionista');
    dialog().contains('button', 'Salvar').click();
    cy.toast('Função Recepcionista salva.');
    cy.get('[aria-label="Excluir Recepcionista"]').click();
    cy.openDialog().contains('button', 'Excluir').click();
    cy.toast('Função Recepcionista excluída.');
  });
});
