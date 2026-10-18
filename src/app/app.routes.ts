import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/auth/guards';

const titulo = (pagina: string) => `${pagina} · Estaciona`;

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'painel' },
  {
    path: 'login',
    title: titulo('Entrar'),
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login'),
  },
  {
    path: 'painel',
    canActivate: [authGuard],
    loadComponent: () => import('./features/shell/shell'),
    children: [
      { path: '', title: titulo('Início'), loadComponent: () => import('./features/home/home') },
      // Operacional
      { path: 'patio', title: titulo('Pátio'), loadComponent: () => import('./features/patio/patio') },
      {
        path: 'veiculos',
        title: titulo('Marcas e modelos'),
        loadComponent: () => import('./features/veiculos/veiculos'),
      },
      {
        path: 'relatorios/operacional',
        title: titulo('Relatório operacional'),
        loadComponent: () => import('./features/relatorio-operacional/relatorio-operacional'),
      },
      // Financeiro
      { path: 'caixa', title: titulo('Caixa'), loadComponent: () => import('./features/caixa/caixa') },
      { path: 'precos', title: titulo('Preços'), loadComponent: () => import('./features/precos/precos') },
      {
        path: 'relatorios/financeiro',
        title: titulo('Relatório financeiro'),
        canActivate: [adminGuard],
        loadComponent: () => import('./features/relatorio-financeiro/relatorio-financeiro'),
      },
      // Recursos humanos
      {
        path: 'equipe',
        title: titulo('Equipe'),
        canActivate: [adminGuard],
        loadComponent: () => import('./features/equipe/equipe'),
      },
      {
        path: 'relatorios/equipe',
        title: titulo('Relatório da equipe'),
        canActivate: [adminGuard],
        loadComponent: () => import('./features/relatorio-equipe/relatorio-equipe'),
      },
      {
        path: 'configuracoes',
        title: titulo('Configurações'),
        canActivate: [adminGuard],
        loadComponent: () => import('./features/configuracoes/configuracoes'),
      },
    ],
  },
  { path: '**', redirectTo: 'painel' },
];
