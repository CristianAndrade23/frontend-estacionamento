import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';

/**
 * Envolve um controle de Signal Forms com rótulo, dica e a primeira mensagem de erro —
 * exibida depois que o usuário interage com o campo ou tenta enviar o formulário.
 */
@Component({
  selector: 'app-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'field', '[class.is-invalid]': 'showError()' },
  template: `
    <label class="field__label" [attr.for]="for()">{{ label() }}</label>
    <ng-content />
    @if (showError()) {
      <span class="field__error" role="alert">{{ errorMessage() }}</span>
    } @else if (hint()) {
      <span class="field__hint">{{ hint() }}</span>
    }
  `,
})
export class Field<T> {
  readonly field = input.required<FieldTree<T>>();
  readonly label = input.required<string>();
  /** id do controle projetado, para associar o `<label>`. */
  readonly for = input<string>();
  readonly hint = input<string>();

  private readonly state = computed(() => this.field()());
  protected readonly showError = computed(() => this.state().touched() && this.state().invalid());
  protected readonly errorMessage = computed(() => this.state().errors()[0]?.message ?? 'Valor inválido');
}
