import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormField, FormRoot, form, maxLength, required, validate } from '@angular/forms/signals';
import { Field } from './field';
import { Icon } from './icon';
import { normalize } from './text';

/**
 * Formulário de um único nome (marca, função). Recusa nomes repetidos sem diferenciar
 * maiúsculas e acentos, antes mesmo de chamar a API.
 * Envie com um botão `type="submit"` que tenha `[attr.form]` igual ao `formId`.
 */
@Component({
  selector: 'app-nome-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormRoot, FormField, Field, Icon],
  template: `
    <form class="stack" [id]="formId()" [formRoot]="nomeForm">
      <app-field [field]="nomeForm.nome" [label]="label()" [for]="formId() + '-nome'">
        <input
          class="input"
          autocomplete="off"
          [id]="formId() + '-nome'"
          [placeholder]="placeholder()"
          [formField]="nomeForm.nome"
        />
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
export class NomeForm {
  readonly formId = input.required<string>();
  readonly label = input.required<string>();
  readonly placeholder = input('');
  readonly inicial = input('');
  /** Nomes já cadastrados (exceto o que está em edição). */
  readonly existentes = input<string[]>([]);
  readonly erro = input<string | null>(null);
  readonly enviado = output<string>();

  private readonly model = signal({ nome: '' });
  protected readonly nomeForm = form(
    this.model,
    (p) => {
      required(p.nome, { message: 'Informe o nome' });
      maxLength(p.nome, 40, { message: 'Máximo de 40 caracteres' });
      validate(p.nome, ({ value }) =>
        this.existentes().some((n) => normalize(n) === normalize(value()))
          ? { kind: 'duplicado', message: 'Já existe um cadastro com esse nome' }
          : undefined,
      );
    },
    {
      submission: {
        action: async () => {
          this.enviado.emit(this.model().nome.trim());
          return undefined;
        },
      },
    },
  );

  ngOnInit() {
    this.model.set({ nome: this.inicial() });
  }
}
