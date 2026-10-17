interface Dashboard {
  ocupadas: number;
}

describe('Configurações', () => {
  beforeEach(() => cy.visitAs('admin', '/painel/configuracoes'));

  it('valida CNPJ e número de vagas', () => {
    cy.api<Dashboard>('GET', '/dashboard').then(({ ocupadas }) => {
      cy.get('#cnpj').clear().type('11222333000182').should('have.value', '11.222.333/0001-82');
      cy.get('#vagas')
        .clear()
        .type(String(ocupadas - 1));
      cy.contains('button', 'Salvar configurações').click();
      cy.contains('.field__error', 'CNPJ inválido');
      cy.contains('.field__error', `Há ${ocupadas} veículos no pátio agora`);
    });
  });

  it('salva e a tela inicial passa a usar a nova capacidade', () => {
    cy.get('#fantasia').clear().type('Estaciona Centro Histórico');
    cy.get('#cnpj').clear().type('11222333000181');
    cy.get('#vagas').clear().type('55');
    cy.get('#taxa-credito').clear().type('2.99');
    cy.contains('button', 'Salvar configurações').click();
    cy.toast('Configurações salvas.');

    cy.navigateTo('Início');
    cy.contains('.kpi', 'Vagas livres').should('contain', 'de 55');
  });
});
