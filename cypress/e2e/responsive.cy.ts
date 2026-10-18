describe('Layout mobile', () => {
  beforeEach(() => cy.viewport(390, 844));

  it('abre e fecha o menu lateral', () => {
    cy.visitAs('admin', '/painel');
    cy.get('.sidebar').should('not.be.visible');
    cy.get('[aria-label="Abrir menu"]').click();
    cy.get('.sidebar').should('be.visible');
    cy.navigateTo('Caixa');
    cy.contains('h1', 'Caixa');
    cy.get('.sidebar').should('not.be.visible');
  });

  it('a tela de login cabe na largura do celular', () => {
    cy.visit('/login');
    cy.document().then((doc) => expect(doc.documentElement.scrollWidth).to.be.at.most(390));
  });
});
