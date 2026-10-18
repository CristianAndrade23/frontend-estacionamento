import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormField, FormRoot, form, max, min, validate } from '@angular/forms/signals';
import { faixasDecrescentes } from '../../core/cobranca';
import { Preco } from '../../core/models';
import { Field } from '../../shared/field';
import { Icon } from '../../shared/icon';

type Valores = Omit<Preco, 'tipo'>;

const CAMPOS: { chave: keyof Valores; rotulo: string }[] = [
  { chave: 'ate15', rotulo: 'Até 15 min' },
  { chave: 'ate30', rotulo: '15 a 30 min' },
  { chave: 'ate45', rotulo: '30 a 45 min' },
  { chave: 'ate60', rotulo: '45 min a 1 h' },
  { chave: 'horaAdicional', rotulo: 'Hora adicional' },
];

@Component({
  selector: 'app-preco-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormRoot, FormField, Field, Icon],
  template: `
    <form id="preco-form" class="stack" [formRoot]="precoForm">
      <div class="form-grid form-grid--3">
        @for (campo of campos; track campo.chave) {
          <app-field
            [field]="precoForm[campo.chave]"
            [label]="campo.rotulo + ' (R$)'"
            [for]="'preco-' + campo.chave"
          >
            <input
              type="number"
              step="0.5"
              class="input input--money"
              [id]="'preco-' + campo.chave"
              [formField]="precoForm[campo.chave]"
            />
          </app-field>
        }
      </div>
      @if (precoForm().errors().length) {
        <div class="alert alert--warning" role="alert">
          <app-icon name="alert" />
          {{ precoForm().errors()[0].message }}
        </div>
      }
      @if (erro(); as message) {
        <div class="alert alert--danger" role="alert">
          <app-icon name="alert" />
          {{ message }}
        </div>
      }
    </form>
  `,
})
export class PrecoForm {
  readonly preco = input.required<Preco>();
  readonly erro = input<string | null>(null);
  readonly enviado = output<Valores>();

  protected readonly campos = CAMPOS;

  private readonly model = signal<Valores>({ ate15: 0, ate30: 0, ate45: 0, ate60: 0, horaAdicional: 0 });
  protected readonly precoForm = form(
    this.model,
    (p) => {
      for (const { chave } of CAMPOS) {
        validate(p[chave], ({ value }) =>
          Number.isFinite(value()) ? undefined : { kind: 'required', message: 'Informe o valor' },
        );
        min(p[chave], 0, { message: 'Não pode ser negativo' });
        max(p[chave], 9999, { message: 'Valor alto demais' });
      }
      validate(p, ({ value }) =>
        faixasDecrescentes(value())
          ? { kind: 'ordem', message: 'Cada faixa precisa custar pelo menos o mesmo que a anterior.' }
          : undefined,
      );
    },
    {
      submission: {
        action: async () => {
          this.enviado.emit(this.model());
          return undefined;
        },
      },
    },
  );

  ngOnInit() {
    const { tipo: _, ...valores } = this.preco();
    this.model.set(valores);
  }
}
