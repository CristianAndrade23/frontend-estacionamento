import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';
import { PRESETS_PERIODO, PresetPeriodo, periodoDoPreset } from '../core/datas';
import { Periodo } from '../core/models';

/** Atalhos de período (Hoje, 7 dias, mês…) e um intervalo personalizado. */
@Component({
  selector: 'app-period-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filters" role="group" aria-label="Período">
      <div class="segmented">
        @for (p of presets(); track p.valor) {
          <button
            type="button"
            [class.is-active]="preset() === p.valor"
            [attr.aria-pressed]="preset() === p.valor"
            (click)="escolher(p.valor)"
          >
            {{ p.nome }}
          </button>
        }
        <button
          type="button"
          [class.is-active]="preset() === 'personalizado'"
          [attr.aria-pressed]="preset() === 'personalizado'"
          (click)="preset.set('personalizado')"
        >
          Personalizado
        </button>
      </div>
      @if (preset() === 'personalizado') {
        <label class="field">
          <span class="field__label">De</span>
          <input
            class="input"
            type="date"
            name="de"
            [value]="periodo().de"
            [max]="periodo().ate"
            (input)="definir('de', $event)"
          />
        </label>
        <label class="field">
          <span class="field__label">Até</span>
          <input
            class="input"
            type="date"
            name="ate"
            [value]="periodo().ate"
            [min]="periodo().de"
            (input)="definir('ate', $event)"
          />
        </label>
      }
    </div>
  `,
})
export class PeriodFilter {
  readonly periodo = model.required<Periodo>();
  /** Atalhos exibidos (por padrão, todos). */
  readonly opcoes = input<PresetPeriodo[]>(PRESETS_PERIODO.map((p) => p.valor));
  readonly inicial = input<PresetPeriodo>('30d');

  protected readonly preset = signal<PresetPeriodo | 'personalizado' | null>(null);
  protected readonly presets = computed(() => PRESETS_PERIODO.filter((p) => this.opcoes().includes(p.valor)));

  ngOnInit() {
    this.preset.set(this.inicial());
  }

  protected escolher(preset: PresetPeriodo) {
    this.preset.set(preset);
    this.periodo.set(periodoDoPreset(preset));
  }

  protected definir(campo: 'de' | 'ate', event: Event) {
    const valor = (event.target as HTMLInputElement).value;
    if (!valor) return;
    const atual = { ...this.periodo(), [campo]: valor };
    // Mantém o intervalo válido se o usuário inverter as datas.
    if (atual.de > atual.ate) {
      if (campo === 'de') atual.ate = atual.de;
      else atual.de = atual.ate;
    }
    this.periodo.set(atual);
  }
}
