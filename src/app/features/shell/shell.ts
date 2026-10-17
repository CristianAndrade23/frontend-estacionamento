import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DemoApi } from '../../core/api/api';
import { apiErrorMessage } from '../../core/api/api-error';
import { SessionService } from '../../core/auth/session.service';
import { Icon, IconName } from '../../shared/icon';
import { ToastService } from '../../shared/toast';

interface NavItem {
  path: string;
  label: string;
  icon: IconName;
  exact?: boolean;
  /** Visível só para o perfil ADMIN. */
  admin?: boolean;
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'Operacional',
    items: [
      { path: '/painel', label: 'Início', icon: 'home', exact: true },
      { path: '/painel/patio', label: 'Pátio', icon: 'car' },
      { path: '/painel/veiculos', label: 'Marcas e modelos', icon: 'tag' },
      { path: '/painel/relatorios/operacional', label: 'Relatório operacional', icon: 'chart' },
    ],
  },
  {
    section: 'Financeiro',
    items: [
      { path: '/painel/caixa', label: 'Caixa', icon: 'wallet' },
      { path: '/painel/precos', label: 'Preços', icon: 'calculator' },
      { path: '/painel/relatorios/financeiro', label: 'Relatório financeiro', icon: 'chart', admin: true },
    ],
  },
  {
    section: 'Recursos humanos',
    items: [
      { path: '/painel/equipe', label: 'Equipe', icon: 'id-card', admin: true },
      { path: '/painel/relatorios/equipe', label: 'Relatório da equipe', icon: 'chart', admin: true },
    ],
  },
  {
    section: 'Sistema',
    items: [{ path: '/painel/configuracoes', label: 'Configurações', icon: 'settings', admin: true }],
  },
];

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export default class Shell {
  protected readonly session = inject(SessionService);
  private readonly demoApi = inject(DemoApi);
  private readonly toast = inject(ToastService);

  protected readonly menuOpen = signal(false);
  protected readonly resetting = signal(false);

  /** Menu do perfil atual: o operador não vê RH, relatórios financeiros nem configurações. */
  protected readonly nav = computed(() => {
    const admin = this.session.isAdmin();
    return NAV.map((group) => ({ ...group, items: group.items.filter((i) => admin || !i.admin) })).filter(
      (group) => group.items.length > 0,
    );
  });

  protected restaurarDemo() {
    this.resetting.set(true);
    this.demoApi.restaurar().subscribe({
      // Recarrega a página para todas as telas buscarem os dados iniciais.
      next: () => window.location.reload(),
      error: (e) => {
        this.resetting.set(false);
        this.toast.error(apiErrorMessage(e, 'Não foi possível restaurar os dados.'));
      },
    });
  }
}
