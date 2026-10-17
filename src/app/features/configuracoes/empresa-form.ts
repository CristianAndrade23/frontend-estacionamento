import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormField, FormRoot, form, max, maxLength, min, required, validate } from '@angular/forms/signals';
import { cnpjValido, mascararCnpj, somenteDigitos } from '../../core/documentos';
import { Empresa } from '../../core/models';
import { Field } from '../../shared/field';
import { Icon } from '../../shared/icon';

const UFS = 'AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO'.split(' ');

@Component({
  selector: 'app-empresa-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormRoot, FormField, Field, Icon],
  template: `
    <form class="stack" [formRoot]="empresaForm">
      <fieldset class="grupo">
        <legend>Empresa</legend>
        <div class="form-grid">
          <app-field
            [field]="empresaForm.razaoSocial"
            label="Razão social"
            for="razao"
            class="form-grid__full"
          >
            <input id="razao" class="input" [formField]="empresaForm.razaoSocial" />
          </app-field>
          <app-field [field]="empresaForm.nomeFantasia" label="Nome fantasia" for="fantasia">
            <input id="fantasia" class="input" [formField]="empresaForm.nomeFantasia" />
          </app-field>
          <app-field [field]="empresaForm.cnpj" label="CNPJ" for="cnpj">
            <input
              id="cnpj"
              class="input"
              inputmode="numeric"
              placeholder="00.000.000/0000-00"
              [value]="empresaForm.cnpj().value()"
              (input)="mascarar($event)"
              (blur)="empresaForm.cnpj().markAsTouched()"
            />
          </app-field>
        </div>
      </fieldset>

      <fieldset class="grupo">
        <legend>Endereço</legend>
        <div class="form-grid form-grid--3">
          <app-field [field]="empresaForm.endereco" label="Endereço" for="endereco" class="form-grid__full">
            <input id="endereco" class="input" [formField]="empresaForm.endereco" />
          </app-field>
          <app-field [field]="empresaForm.cidade" label="Cidade" for="cidade">
            <input id="cidade" class="input" [formField]="empresaForm.cidade" />
          </app-field>
          <app-field [field]="empresaForm.uf" label="UF" for="uf">
            <select id="uf" class="input" [formField]="empresaForm.uf">
              @for (uf of ufs; track uf) {
                <option [value]="uf">{{ uf }}</option>
              }
            </select>
          </app-field>
        </div>
      </fieldset>

      <fieldset class="grupo">
        <legend>Operação</legend>
        <div class="form-grid form-grid--3">
          <app-field
            [field]="empresaForm.vagas"
            label="Número de vagas"
            for="vagas"
            [hint]="ocupadas() + ' ocupadas agora'"
          >
            <input id="vagas" type="number" class="input" [formField]="empresaForm.vagas" />
          </app-field>
          <app-field [field]="empresaForm.taxaDebito" label="Taxa do débito (%)" for="taxa-debito">
            <input
              id="taxa-debito"
              type="number"
              step="0.01"
              class="input input--money"
              [formField]="empresaForm.taxaDebito"
            />
          </app-field>
          <app-field [field]="empresaForm.taxaCredito" label="Taxa do crédito (%)" for="taxa-credito">
            <input
              id="taxa-credito"
              type="number"
              step="0.01"
              class="input input--money"
              [formField]="empresaForm.taxaCredito"
            />
          </app-field>
        </div>
      </fieldset>

      @if (erro(); as message) {
        <div class="alert alert--danger" role="alert">
          <app-icon name="alert" />
          {{ message }}
        </div>
      }

      <div class="row">
        <button type="submit" class="btn btn--primary" [disabled]="empresaForm().submitting()">
          {{ empresaForm().submitting() ? 'Salvando…' : 'Salvar configurações' }}
        </button>
      </div>
    </form>
  `,
  styles: `
    .grupo {
      margin: 0;
      padding: 0;
      border: 0;
    }
    .grupo legend {
      margin-bottom: 12px;
      font-size: 15px;
      font-weight: 700;
    }
  `,
})
export class EmpresaForm {
  readonly empresa = input.required<Empresa>();
  readonly ocupadas = input(0);
  readonly erro = input<string | null>(null);
  /** Recebe os dados e devolve uma Promise: o botão fica em "Salvando…" até ela terminar. */
  readonly salvar = input.required<(empresa: Empresa) => Promise<void>>();

  protected readonly ufs = UFS;

  private readonly model = signal<Empresa>({
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    vagas: 1,
    endereco: '',
    cidade: '',
    uf: 'RS',
    taxaDebito: 0,
    taxaCredito: 0,
  });

  protected readonly empresaForm = form(
    this.model,
    (p) => {
      required(p.razaoSocial, { message: 'Informe a razão social' });
      maxLength(p.razaoSocial, 120, { message: 'Máximo de 120 caracteres' });
      required(p.nomeFantasia, { message: 'Informe o nome fantasia' });
      maxLength(p.nomeFantasia, 60, { message: 'Máximo de 60 caracteres' });
      required(p.cnpj, { message: 'Informe o CNPJ' });
      validate(p.cnpj, ({ value }) =>
        value() && !cnpjValido(value()) ? { kind: 'cnpj', message: 'CNPJ inválido' } : undefined,
      );
      required(p.endereco, { message: 'Informe o endereço' });
      required(p.cidade, { message: 'Informe a cidade' });

      validate(p.vagas, ({ value }) =>
        !Number.isInteger(value())
          ? { kind: 'inteiro', message: 'Informe um número inteiro' }
          : value() < this.ocupadas()
            ? { kind: 'ocupadas', message: `Há ${this.ocupadas()} veículos no pátio agora` }
            : undefined,
      );
      min(p.vagas, 1, { message: 'Mínimo de 1 vaga' });
      max(p.vagas, 2000, { message: 'Máximo de 2000 vagas' });
      for (const taxa of [p.taxaDebito, p.taxaCredito]) {
        validate(taxa, ({ value }) =>
          Number.isFinite(value()) ? undefined : { kind: 'required', message: 'Informe a taxa' },
        );
        min(taxa, 0, { message: 'Não pode ser negativa' });
        max(taxa, 20, { message: 'Máximo de 20%' });
      }
    },
    {
      submission: {
        action: async () => {
          await this.salvar()({ ...this.model(), cnpj: somenteDigitos(this.model().cnpj) });
          return undefined;
        },
      },
    },
  );

  ngOnInit() {
    const e = this.empresa();
    this.model.set({ ...e, cnpj: mascararCnpj(e.cnpj) });
  }

  protected mascarar(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = mascararCnpj(input.value);
    this.empresaForm.cnpj().value.set(input.value);
  }
}
