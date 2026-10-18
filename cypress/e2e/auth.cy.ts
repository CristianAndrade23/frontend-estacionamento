const menu = () => cy.get('nav[aria-label="Menu principal"]');

describe('Autenticação e perfis', () => {
  it('valida os campos e recusa credenciais inválidas', () => {
    cy.visit('/login');
    cy.contains('button', 'Entrar').click();
    cy.contains('.field__error', 'Informe o usuário');
    cy.contains('.field__error', 'Informe a senha');

    cy.loginViaUi('admin', 'errada');
    cy.contains('.alert', 'Usuário ou senha inválidos').should('be.visible');
    cy.location('pathname').should('eq', '/login');
  });

  it('entra como administrador e vê o menu completo', () => {
    cy.loginViaUi();
    cy.location('pathname').should('eq', '/painel');
    cy.contains('h1', 'Ana');
    menu().within(() => {
      ['Pátio', 'Caixa', 'Relatório financeiro', 'Equipe', 'Configurações'].forEach((item) =>
        cy.contains('a', item).should('be.visible'),
      );
    });
  });

  it('o operador cuida do pátio e do caixa, sem RH, financeiro ou configurações', () => {
    cy.visit('/login');
    cy.contains('button', 'Operador').click();
    cy.contains('button', 'Entrar').click();
    cy.contains('.sidebar__user', 'Carlos Lima').and('contain', 'Operador');
    menu().should('contain', 'Pátio').and('contain', 'Caixa').and('contain', 'Preços');
    menu()
      .should('not.contain', 'Equipe')
      .and('not.contain', 'Configurações')
      .and('not.contain', 'financeiro');

    // Tentar abrir a URL direto também não funciona.
    cy.visitAs('operador', '/painel/equipe');
    cy.location('pathname').should('eq', '/painel');
  });

  it('protege o painel sem sessão', () => {
    cy.visit('/painel/caixa');
    cy.location('pathname').should('eq', '/login');
  });

  it('mantém a sessão ao recarregar e sai pelo menu', () => {
    cy.visitAs('admin', '/painel/precos');
    cy.contains('h1', 'Preços');
    cy.reload();
    cy.contains('h1', 'Preços');

    cy.contains('button', 'Sair').click();
    cy.location('pathname').should('eq', '/login');
    cy.visit('/painel');
    cy.location('pathname').should('eq', '/login');
  });

  it('volta para o login quando a API recusa o token', () => {
    const sessao = {
      token: 'token-invalido',
      expiraEm: '2999-01-01T00:00:00Z',
      usuario: { username: 'admin', nome: 'Ana Ribeiro', perfil: 'ADMIN' },
    };
    cy.visit('/painel', {
      onBeforeLoad: (win) => win.localStorage.setItem('estaciona:sessao', JSON.stringify(sessao)),
    });
    cy.location('pathname').should('eq', '/login');
    cy.contains('.alert', 'Sua sessão expirou');
  });
});
