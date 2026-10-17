import { CurrencyPipe, DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API } from '../../core/api/api';
import { formatarDuracao } from '../../core/datas';
import { formatarPlaca } from '../../core/documentos';
import { FORMAS_PAGAMENTO, FormaPagamento, Movimentacao, nomeTipo } from '../../core/models';
import { Icon, IconName } from '../../shared/icon';

const ICONE_FORMA: Record<FormaPagamento, IconName> = {
  PIX: 'qr',
  CREDITO: 'card',
  DEBITO: 'card',
  DINHEIRO: 'cash',
};

/**
 * Saída do pátio: mostra quanto o veículo paga agora (prévia calculada pela API) e pede a forma
 * de pagamento. Sem caixa aberto, a saída fica bloqueada.
 */
@Component({
  selector: 'app-saida-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, CurrencyPipe, DatePipe, RouterLink],
  template: `
    @if (previa.error()) {
      <div class="alert alert--danger">
        <app-icon name="alert" />
        Não foi possível calcular o valor.
        <button type="button" class="link" (click)="previa.reload()">Tentar novamente</button>
      </div>
    } @else if (!previa.hasValue()) {
      <p class="text-muted">Calculando valor…</p>
    } @else {
      @let m = previa.value();
      <form id="saida-form" class="stack" (submit)="enviar($event)">
        <div class="saida__resumo">
          <div>
            <span class="plate">{{ placa(m.placa) }}</span>
            <p class="text-muted">{{ m.modelo.marca }} {{ m.modelo.nome }} · {{ tipo(m.modelo.tipo) }}</p>
          </div>
          <div class="saida__valor">
            <span class="text-muted">Total</span>
            <strong>{{ m.valor | currency: 'BRL' }}</strong>
          </div>
        </div>

        <dl class="details">
          <dt>Entrada</dt>
          <dd>{{ m.entrada | date: 'dd/MM/yyyy HH:mm' }}</dd>
          <dt>Permanência</dt>
          <dd>{{ duracao(m.permanenciaMinutos) }}</dd>
          <dt>Cobrança</dt>
          <dd>{{ m.regime }}</dd>
        </dl>

        <fieldset class="saida__formas">
          <legend class="field__label">Forma de pagamento</legend>
          <div class="choices">
            @for (f of formas; track f.valor) {
              <label class="choice">
                <input
                  type="radio"
                  name="forma"
                  [value]="f.valor"
                  [checked]="forma() === f.valor"
                  (change)="forma.set(f.valor)"
                />
                <app-icon [name]="icone[f.valor]" />
                {{ f.nome }}
              </label>
            }
          </div>
          @if (tentou() && !forma()) {
            <span class="field__error" role="alert">Selecione a forma de pagamento</span>
          }
        </fieldset>

        @if (!caixaAberto()) {
          <div class="alert alert--warning" role="alert">
            <app-icon name="lock" />
            O caixa está fechado. <a routerLink="/painel/caixa">Abra o caixa</a> para registrar saídas.
          </div>
        }
        @if (erro(); as message) {
          <div class="alert alert--danger" role="alert">
            <app-icon name="alert" />
            {{ message }}
          </div>
        }
      </form>
    }
  `,
  styles: `
    .saida__resumo {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }
    .saida__resumo p {
      margin: 6px 0 0;
    }
    .saida__valor {
      display: grid;
      justify-items: end;
    }
    .saida__valor strong {
      font-size: 32px;
      line-height: 1.1;
    }
    .saida__formas {
      display: grid;
      gap: 8px;
      margin: 0;
      padding: 0;
      border: 0;
    }
  `,
})
export class SaidaForm {
  readonly movimentacaoId = input.required<number>();
  readonly caixaAberto = input(true);
  readonly erro = input<string | null>(null);
  readonly enviado = output<FormaPagamento>();

  protected readonly previa = httpResource<Movimentacao>(
    () => `${API}/movimentacoes/${this.movimentacaoId()}/previa-saida`,
  );

  protected readonly formas = FORMAS_PAGAMENTO;
  protected readonly icone = ICONE_FORMA;
  protected readonly placa = formatarPlaca;
  protected readonly tipo = nomeTipo;
  protected readonly duracao = formatarDuracao;

  protected readonly forma = signal<FormaPagamento | null>(null);
  protected readonly tentou = signal(false);

  protected enviar(event: Event) {
    event.preventDefault();
    this.tentou.set(true);
    const forma = this.forma();
    if (forma) this.enviado.emit(forma);
  }
}
