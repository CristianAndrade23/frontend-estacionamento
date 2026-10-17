import { CurrencyPipe, DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API } from '../../core/api/api';
import { SessionService } from '../../core/auth/session.service';
import { formatarDuracao } from '../../core/datas';
import { numero, percentual } from '../../core/formato';
import { Dashboard, nomeTipo } from '../../core/models';
import { BarChart, BarDatum, horasComMovimento } from '../../shared/bar-chart';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, BarChart, CurrencyPipe, DatePipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export default class Home {
  protected readonly session = inject(SessionService);
  protected readonly dashboard = httpResource<Dashboard>(() => `${API}/dashboard`);

  protected readonly duracao = formatarDuracao;
  protected readonly numero = numero;

  protected readonly saudacao = computed(() => {
    const hora = new Date().getHours();
    const nome = this.session.usuario()?.nome.split(' ')[0] ?? '';
    const periodo = hora >= 5 && hora < 12 ? 'Bom dia' : hora >= 12 && hora < 18 ? 'Boa tarde' : 'Boa noite';
    return `${periodo}, ${nome}.`;
  });

  protected readonly ocupacao = computed(() => {
    const d = this.dashboard.value();
    if (!d) return null;
    const pct = d.vagas ? (d.ocupadas / d.vagas) * 100 : 0;
    return {
      pct,
      texto: percentual(d.ocupadas, d.vagas),
      // Status sempre acompanhado do texto: nunca só a cor.
      tom: pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : 'ok',
      rotulo: pct >= 90 ? 'Quase lotado' : pct >= 70 ? 'Movimentado' : 'Tranquilo',
    } as const;
  });

  /** Entradas por hora até as 23h, a partir das 6h ou da primeira hora com movimento, se for antes. */
  protected readonly porHora = computed<BarDatum[]>(() =>
    horasComMovimento(this.dashboard.value()?.entradasPorHoraHoje ?? []),
  );

  protected readonly porTipo = computed<BarDatum[]>(() => {
    const d = this.dashboard.value();
    if (!d) return [];
    return d.noPatioPorTipo.map((t) => ({
      label: nomeTipo(t.tipo),
      value: t.quantidade,
      detail: percentual(t.quantidade, d.ocupadas),
    }));
  });

  constructor() {
    // Mantém os números do pátio atualizados enquanto a tela estiver aberta.
    const timer = setInterval(() => this.dashboard.reload(), 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
