import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormField, FormRoot, form, required, validate } from '@angular/forms/signals';
import { API } from '../../core/api/api';
import { mascararPlaca, placaValida } from '../../core/documentos';
import { Modelo, nomeTipo } from '../../core/models';
import { Field } from '../../shared/field';
import { Icon } from '../../shared/icon';

export interface EntradaRequest {
  placa: string;
  modeloId: number;
}

/** Formulário de entrada no pátio: placa (com máscara) e modelo, agrupado por marca. */
@Component({
  selector: 'app-entrada-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormRoot, FormField, Field, Icon],
  template: `
    <form id="entrada-form" class="stack" [formRoot]="entradaForm">
      <app-field
        [field]="entradaForm.placa"
        label="Placa"
        for="placa"
        hint="Padrão antigo (ABC-1234) ou Mercosul (ABC1D23)."
      >
        <input
          id="placa"
          class="input input--plate"
          autocomplete="off"
          placeholder="ABC1D23"
          [value]="entradaForm.placa().value()"
          (input)="mascarar($event)"
          (blur)="entradaForm.placa().markAsTouched()"
        />
      </app-field>

      <app-field [field]="entradaForm.modeloId" label="Modelo" for="modelo">
        <select id="modelo" class="input" [formField]="entradaForm.modeloId">
          <option value="" disabled>{{ modelos.hasValue() ? 'Selecione…' : 'Carregando modelos…' }}</option>
          @for (grupo of porMarca(); track grupo.marca) {
            <optgroup [label]="grupo.marca">
              @for (m of grupo.modelos; track m.id) {
                <option [value]="m.id">{{ m.nome }} · {{ tipo(m.tipo) }}</option>
              }
            </optgroup>
          }
        </select>
      </app-field>

      @if (erro(); as message) {
        <div class="alert alert--danger" role="alert">
          <app-icon name="alert" />
          {{ message }}
        </div>
      }
    </form>
  `,
})
export class EntradaForm {
  readonly erro = input<string | null>(null);
  readonly enviado = output<EntradaRequest>();

  protected readonly modelos = httpResource<Modelo[]>(() => `${API}/modelos`);
  protected readonly tipo = nomeTipo;

  protected readonly porMarca = computed(() => {
    const grupos = new Map<string, Modelo[]>();
    for (const m of this.modelos.value() ?? []) {
      grupos.set(m.marca.nome, [...(grupos.get(m.marca.nome) ?? []), m]);
    }
    return [...grupos].map(([marca, modelos]) => ({ marca, modelos }));
  });

  private readonly model = signal({ placa: '', modeloId: '' });
  protected readonly entradaForm = form(
    this.model,
    (p) => {
      required(p.placa, { message: 'Informe a placa' });
      validate(p.placa, ({ value }) =>
        value() && !placaValida(value())
          ? { kind: 'placa', message: 'Placa inválida (use ABC-1234 ou ABC1D23)' }
          : undefined,
      );
      required(p.modeloId, { message: 'Selecione o modelo' });
    },
    {
      submission: {
        action: async () => {
          const { placa, modeloId } = this.model();
          this.enviado.emit({ placa, modeloId: Number(modeloId) });
          return undefined;
        },
      },
    },
  );

  protected mascarar(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = mascararPlaca(input.value);
    this.entradaForm.placa().value.set(input.value);
  }
}
