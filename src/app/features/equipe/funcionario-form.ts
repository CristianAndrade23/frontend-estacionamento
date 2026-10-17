import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormField, FormRoot, form, maxLength, minLength, required, validate } from '@angular/forms/signals';
import { anosCompletos, dia, isoDia } from '../../core/datas';
import { cpfValido, mascararCpf, somenteDigitos } from '../../core/documentos';
import { Funcao, Funcionario, FuncionarioRequest } from '../../core/models';
import { Field } from '../../shared/field';
import { Icon } from '../../shared/icon';

/** Mesma idade mínima do backend (`RhService.IDADE_MINIMA`). */
export const IDADE_MINIMA = 16;

@Component({
  selector: 'app-funcionario-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormRoot, FormField, Field, Icon],
  template: `
    <form id="funcionario-form" class="stack" [formRoot]="funcionarioForm">
      <div class="form-grid">
        <app-field
          [field]="funcionarioForm.nome"
          label="Nome completo"
          for="func-nome"
          class="form-grid__full"
        >
          <input id="func-nome" class="input" autocomplete="off" [formField]="funcionarioForm.nome" />
        </app-field>
        <app-field [field]="funcionarioForm.cpf" label="CPF" for="func-cpf">
          <input
            id="func-cpf"
            class="input"
            inputmode="numeric"
            autocomplete="off"
            placeholder="000.000.000-00"
            [value]="funcionarioForm.cpf().value()"
            (input)="mascarar($event)"
            (blur)="funcionarioForm.cpf().markAsTouched()"
          />
        </app-field>
        <app-field [field]="funcionarioForm.funcaoId" label="Função" for="func-funcao">
          <select id="func-funcao" class="input" [formField]="funcionarioForm.funcaoId">
            <option value="" disabled>Selecione…</option>
            @for (f of funcoes(); track f.id) {
              <option [value]="f.id">{{ f.nome }}</option>
            }
          </select>
        </app-field>
        <app-field [field]="funcionarioForm.nascimento" label="Data de nascimento" for="func-nascimento">
          <input id="func-nascimento" type="date" class="input" [formField]="funcionarioForm.nascimento" />
        </app-field>
        <app-field [field]="funcionarioForm.admissao" label="Data de admissão" for="func-admissao">
          <input id="func-admissao" type="date" class="input" [formField]="funcionarioForm.admissao" />
        </app-field>
      </div>
      @if (erro(); as message) {
        <div class="alert alert--danger" role="alert">
          <app-icon name="alert" />
          {{ message }}
        </div>
      }
    </form>
  `,
})
export class FuncionarioForm {
  readonly funcionario = input<Funcionario | null>(null);
  readonly funcoes = input.required<Funcao[]>();
  readonly funcionarios = input.required<Funcionario[]>();
  readonly erro = input<string | null>(null);
  readonly enviado = output<FuncionarioRequest>();

  protected readonly hoje = isoDia(new Date());

  private readonly model = signal({ nome: '', cpf: '', funcaoId: '', nascimento: '', admissao: this.hoje });
  protected readonly funcionarioForm = form(
    this.model,
    (p) => {
      required(p.nome, { message: 'Informe o nome' });
      minLength(p.nome, 3, { message: 'Mínimo de 3 caracteres' });
      maxLength(p.nome, 80, { message: 'Máximo de 80 caracteres' });

      required(p.cpf, { message: 'Informe o CPF' });
      validate(p.cpf, ({ value }) => {
        if (!value()) return undefined;
        if (!cpfValido(value())) return { kind: 'cpf', message: 'CPF inválido' };
        const cpf = somenteDigitos(value());
        const repetido = this.funcionarios().some((f) => f.cpf === cpf && f.id !== this.funcionario()?.id);
        return repetido ? { kind: 'duplicado', message: 'Já existe um funcionário com este CPF' } : undefined;
      });

      required(p.funcaoId, { message: 'Selecione a função' });

      required(p.nascimento, { message: 'Informe a data de nascimento' });
      required(p.admissao, { message: 'Informe a data de admissão' });
      validate(p.admissao, ({ value, valueOf }) => {
        const nascimento = valueOf(p.nascimento);
        if (!value()) return undefined;
        if (value() > this.hoje) return { kind: 'futuro', message: 'A admissão não pode ser no futuro' };
        if (nascimento && anosCompletos(dia(nascimento), dia(value())) < IDADE_MINIMA) {
          return { kind: 'idade', message: `Precisa ter pelo menos ${IDADE_MINIMA} anos na admissão` };
        }
        return undefined;
      });
    },
    {
      submission: {
        action: async () => {
          const { nome, cpf, funcaoId, nascimento, admissao } = this.model();
          this.enviado.emit({
            nome: nome.trim(),
            cpf: somenteDigitos(cpf),
            funcaoId: Number(funcaoId),
            nascimento,
            admissao,
          });
          return undefined;
        },
      },
    },
  );

  ngOnInit() {
    const f = this.funcionario();
    if (f) {
      this.model.set({
        nome: f.nome,
        cpf: mascararCpf(f.cpf),
        funcaoId: String(f.funcao.id),
        nascimento: f.nascimento,
        admissao: f.admissao,
      });
    }
  }

  protected mascarar(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = mascararCpf(input.value);
    this.funcionarioForm.cpf().value.set(input.value);
  }
}
