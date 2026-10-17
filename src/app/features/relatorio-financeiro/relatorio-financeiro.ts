import { CurrencyPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { API, comParams } from '../../core/api/api';
import { dia, periodoDoPreset } from '../../core/datas';
import { brl, brlCompacto, numero, percentual } from '../../core/formato';
import { Periodo, RelatorioFinanceiro, nomeForma, nomeTipo } from '../../core/models';
import { BarChart, BarDatum } from '../../shared/bar-chart';
import { Icon } from '../../shared/icon';
import { PeriodFilter } from '../../shared/period-filter';

const diaCurto = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });

@Component({
  selector: 'app-relatorio-financeiro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BarChart, Icon, PeriodFilter, CurrencyPipe],
  templateUrl: './relatorio-financeiro.html',
})
export default class RelatorioFinanceiroPage {
  protected readonly periodo = signal<Periodo>(periodoDoPreset('mes'));
  protected readonly relatorio = httpResource<RelatorioFinanceiro>(() =>
    comParams(`${API}/relatorios/financeiro`, this.periodo()),
  );

  protected readonly brl = brl;
  protected readonly brlCompacto = brlCompacto;
  protected readonly numero = numero;
  protected readonly percentual = percentual;
  protected readonly forma = nomeForma;

  protected readonly porDia = computed<BarDatum[]>(() =>
    (this.relatorio.value()?.porDia ?? []).map((d) => ({
      label: diaCurto.format(dia(d.data)),
      value: d.valor,
    })),
  );
  protected readonly labelEvery = computed(() => Math.max(1, Math.ceil(this.porDia().length / 8)));

  protected readonly porForma = computed<BarDatum[]>(() => {
    const r = this.relatorio.value();
    if (!r) return [];
    return r.porForma.map((f) => ({
      label: nomeForma(f.forma),
      value: f.valor,
      detail: `${percentual(f.valor, r.receitaBruta)} · ${numero(f.quantidade)} pagamentos`,
    }));
  });

  protected readonly porTipo = computed<BarDatum[]>(() => {
    const r = this.relatorio.value();
    if (!r) return [];
    return r.porTipo.map((t) => ({
      label: nomeTipo(t.tipo),
      value: t.valor,
      detail: `${percentual(t.valor, r.receitaBruta)} · ${numero(t.quantidade)} saídas`,
    }));
  });
}
