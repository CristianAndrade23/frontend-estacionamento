import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface BarDatum {
  /** Rótulo do eixo/da linha (ex.: "14h", "17/10", "Pix"). */
  label: string;
  value: number;
  /** Texto complementar no tooltip e na tabela (ex.: "35 pagamentos"). */
  detail?: string;
}

/** Arredonda para cima até um valor "redondo" (1, 2, 2,5, 5 × 10ⁿ), usado como topo do eixo. */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value)!;
  return step * magnitude;
}

/**
 * Série de 24 horas (índice = hora) para barras, até as 23h. Começa às 6h — a madrugada costuma
 * ser vazia — ou antes, na primeira hora que teve movimento.
 */
export function horasComMovimento(porHora: number[], detail = 'entradas'): BarDatum[] {
  const primeira = porHora.findIndex((v) => v > 0);
  const inicio = primeira === -1 ? 6 : Math.min(6, primeira);
  return porHora.map((value, hora) => ({ label: `${hora}h`, value, detail })).slice(inicio);
}

const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

/**
 * Gráfico de barras de série única, em HTML/CSS (sem biblioteca).
 * - vertical: colunas para séries no tempo (por dia, por hora), eixo Y com 3 linhas de grade;
 * - horizontal: categorias (forma de pagamento, tipo de veículo) com o valor na ponta.
 * Cada barra recebe foco e mostra um tooltip; a tabela com todos os valores fica logo abaixo.
 */
@Component({
  selector: 'app-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="chart" [attr.aria-label]="caption()">
      @if (orientation() === 'vertical') {
        <div class="chart__plot" [style.height.px]="height()">
          <div class="chart__axis" aria-hidden="true">
            @for (tick of ticks(); track tick.value) {
              <span [style.bottom.%]="tick.pct">{{ axisFormat()(tick.value) }}</span>
            }
          </div>
          <div class="chart__area">
            @for (tick of ticks(); track tick.value) {
              <i class="chart__grid" [style.bottom.%]="tick.pct"></i>
            }
            <div class="chart__columns">
              @for (bar of bars(); track bar.label; let i = $index) {
                <div
                  class="chart__slot"
                  tabindex="0"
                  role="img"
                  [attr.aria-label]="bar.label + ': ' + format()(bar.value)"
                >
                  @if (bar.isPeak) {
                    <span class="chart__peak" [style.bottom.%]="bar.pct">{{ format()(bar.value) }}</span>
                  }
                  <span class="chart__col" [style.height.%]="bar.pct"></span>
                  <span class="chart__tip" role="presentation">
                    <strong>{{ format()(bar.value) }}</strong>
                    <span>{{ bar.label }}{{ bar.detail ? ' · ' + bar.detail : '' }}</span>
                  </span>
                </div>
              }
            </div>
          </div>
        </div>
        <div class="chart__labels" aria-hidden="true">
          @for (bar of bars(); track bar.label; let i = $index) {
            <span>{{ i % labelEvery() === 0 ? bar.label : '' }}</span>
          }
        </div>
      } @else {
        <div class="chart__rows">
          @for (bar of bars(); track bar.label) {
            <div class="chart__row" tabindex="0">
              <span class="chart__row-label">{{ bar.label }}</span>
              <span class="chart__track"><span class="chart__bar" [style.width.%]="bar.pct"></span></span>
              <span class="chart__row-value">
                {{ format()(bar.value) }}
                @if (bar.detail) {
                  <small>{{ bar.detail }}</small>
                }
              </span>
            </div>
          }
        </div>
      }

      <details class="chart__table">
        <summary>Ver dados em tabela</summary>
        <table class="table table--compact">
          <caption class="sr-only">
            {{
              caption()
            }}
          </caption>
          <tbody>
            @for (bar of data(); track bar.label) {
              <tr>
                <th scope="row">{{ bar.label }}</th>
                <td class="num">{{ format()(bar.value) }}</td>
                @if (hasDetail()) {
                  <td class="num">{{ bar.detail }}</td>
                }
              </tr>
            }
          </tbody>
        </table>
      </details>
    </figure>
  `,
  styleUrl: './bar-chart.css',
})
export class BarChart {
  readonly data = input.required<BarDatum[]>();
  readonly caption = input.required<string>();
  readonly orientation = input<'vertical' | 'horizontal'>('vertical');
  readonly height = input(180);
  /** Mostra o rótulo do eixo X a cada N barras (séries longas). */
  readonly labelEvery = input(1);
  readonly format = input<(value: number) => string>((v) => v.toLocaleString('pt-BR'));
  readonly axisFormat = input<(value: number) => string>((v) => compact.format(v));

  private readonly max = computed(() => {
    const top = Math.max(0, ...this.data().map((d) => d.value));
    return this.orientation() === 'vertical' ? niceMax(top) : top || 1;
  });

  protected readonly ticks = computed(() =>
    [0, 0.5, 1].map((f) => ({ value: this.max() * f, pct: f * 100 })),
  );

  protected readonly hasDetail = computed(() => this.data().some((d) => d.detail));

  protected readonly bars = computed(() => {
    const max = this.max();
    const peak = Math.max(...this.data().map((d) => d.value));
    let peakMarked = false;
    return this.data().map((d) => {
      // Rótulo direto só no maior valor (o restante fica no tooltip e na tabela).
      const isPeak = !peakMarked && d.value === peak && peak > 0;
      if (isPeak) peakMarked = true;
      return { ...d, pct: (d.value / max) * 100, isPeak };
    });
  });
}
