import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { API, comParams } from '../../core/api/api';
import { dia, formatarDuracao, periodoDoPreset } from '../../core/datas';
import { numero, percentual } from '../../core/formato';
import { Periodo, RelatorioOperacional, nomeTipo } from '../../core/models';
import { BarChart, BarDatum, horasComMovimento } from '../../shared/bar-chart';
import { Icon } from '../../shared/icon';
import { PeriodFilter } from '../../shared/period-filter';

const diaCurto = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });

@Component({
  selector: 'app-relatorio-operacional',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BarChart, Icon, PeriodFilter],
  templateUrl: './relatorio-operacional.html',
})
export default class RelatorioOperacionalPage {
  protected readonly periodo = signal<Periodo>(periodoDoPreset('30d'));
  protected readonly relatorio = httpResource<RelatorioOperacional>(() =>
    comParams(`${API}/relatorios/operacional`, this.periodo()),
  );

  protected readonly duracao = formatarDuracao;
  protected readonly numero = numero;
  protected readonly percentual = percentual;
  protected readonly tipo = nomeTipo;

  protected readonly porDia = computed<BarDatum[]>(() =>
    (this.relatorio.value()?.porDia ?? []).map((d) => ({
      label: diaCurto.format(dia(d.data)),
      value: d.quantidade,
      detail: 'entradas',
    })),
  );
  /** Um rótulo de dia a cada ~8 colunas, para não encavalar. */
  protected readonly labelEvery = computed(() => Math.max(1, Math.ceil(this.porDia().length / 8)));

  protected readonly porHora = computed<BarDatum[]>(() =>
    horasComMovimento(this.relatorio.value()?.porHora ?? []),
  );

  protected readonly porTipo = computed<BarDatum[]>(() => {
    const r = this.relatorio.value();
    if (!r) return [];
    return r.porTipo.map((t) => ({
      label: nomeTipo(t.tipo),
      value: t.quantidade,
      detail: percentual(t.quantidade, r.entradas),
    }));
  });

  protected readonly pico = computed(() => {
    const horas = this.relatorio.value()?.porHora ?? [];
    const max = Math.max(0, ...horas);
    return max > 0 ? `${horas.indexOf(max)}h` : '—';
  });

  protected readonly mediaDiaria = computed(() => {
    const r = this.relatorio.value();
    return r && r.porDia.length ? Math.round(r.entradas / r.porDia.length) : 0;
  });
}
