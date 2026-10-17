import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormField, FormRoot, form, maxLength, required, validate } from '@angular/forms/signals';
import { Marca, Modelo, ModeloRequest, TIPOS_VEICULO, TipoVeiculo } from '../../core/models';
import { Field } from '../../shared/field';
import { Icon, IconName } from '../../shared/icon';
import { normalize } from '../../shared/text';

const ICONE_TIPO: Record<TipoVeiculo, IconName> = { CARRO: 'car', MOTO: 'bike', CAMINHONETE: 'truck' };

@Component({
  selector: 'app-modelo-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormRoot, FormField, Field, Icon],
  template: `
    <form id="modelo-form" class="stack" [formRoot]="modeloForm">
      <div class="form-grid">
        <app-field [field]="modeloForm.marcaId" label="Marca" for="modelo-marca">
          <select id="modelo-marca" class="input" [formField]="modeloForm.marcaId">
            <option value="" disabled>Selecione…</option>
            @for (m of marcas(); track m.id) {
              <option [value]="m.id">{{ m.nome }}</option>
            }
          </select>
        </app-field>
        <app-field [field]="modeloForm.nome" label="Nome do modelo" for="modelo-nome">
          <input
            id="modelo-nome"
            class="input"
            autocomplete="off"
            placeholder="Ex.: Onix"
            [formField]="modeloForm.nome"
          />
        </app-field>
      </div>

      <fieldset class="tipo">
        <legend class="field__label">Tipo de veículo</legend>
        <div class="choices">
          @for (t of tipos; track t.valor) {
            <label class="choice">
              <input
                type="radio"
                name="tipo"
                [value]="t.valor"
                [checked]="modeloForm.tipo().value() === t.valor"
                (change)="modeloForm.tipo().value.set(t.valor)"
              />
              <app-icon [name]="icone[t.valor]" [size]="22" />
              {{ t.nome }}
            </label>
          }
        </div>
        <span class="field__hint">Define a tabela de preços usada na saída.</span>
      </fieldset>

      @if (erro(); as message) {
        <div class="alert alert--danger" role="alert">
          <app-icon name="alert" />
          {{ message }}
        </div>
      }
    </form>
  `,
  styles: `
    .tipo {
      display: grid;
      gap: 8px;
      margin: 0;
      padding: 0;
      border: 0;
    }
  `,
})
export class ModeloForm {
  readonly modelo = input<Modelo | null>(null);
  readonly marcas = input.required<Marca[]>();
  readonly modelos = input.required<Modelo[]>();
  readonly erro = input<string | null>(null);
  readonly enviado = output<ModeloRequest>();

  protected readonly tipos = TIPOS_VEICULO;
  protected readonly icone = ICONE_TIPO;

  private readonly model = signal<{ nome: string; marcaId: string; tipo: TipoVeiculo }>({
    nome: '',
    marcaId: '',
    tipo: 'CARRO',
  });

  protected readonly modeloForm = form(
    this.model,
    (p) => {
      required(p.marcaId, { message: 'Selecione a marca' });
      required(p.nome, { message: 'Informe o nome do modelo' });
      maxLength(p.nome, 40, { message: 'Máximo de 40 caracteres' });
      validate(p.nome, ({ value, valueOf }) => {
        const marcaId = Number(valueOf(p.marcaId));
        const repetido = this.modelos().some(
          (m) =>
            m.id !== this.modelo()?.id && m.marca.id === marcaId && normalize(m.nome) === normalize(value()),
        );
        return repetido
          ? { kind: 'duplicado', message: 'Essa marca já tem um modelo com esse nome' }
          : undefined;
      });
    },
    {
      submission: {
        action: async () => {
          const { nome, marcaId, tipo } = this.model();
          this.enviado.emit({ nome: nome.trim(), marcaId: Number(marcaId), tipo });
          return undefined;
        },
      },
    },
  );

  ngOnInit() {
    const m = this.modelo();
    if (m) this.model.set({ nome: m.nome, marcaId: String(m.marca.id), tipo: m.tipo });
  }
}
