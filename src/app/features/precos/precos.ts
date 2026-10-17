import { CurrencyPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { API, PrecosApi } from '../../core/api/api';
import { apiErrorMessage } from '../../core/api/api-error';
import { SessionService } from '../../core/auth/session.service';
import { calcularCobranca } from '../../core/cobranca';
import { formatarDuracao } from '../../core/datas';
import { Preco, TIPOS_VEICULO, TipoVeiculo, nomeTipo } from '../../core/models';
import { Icon } from '../../shared/icon';
import { Modal } from '../../shared/modal';
import { ToastService } from '../../shared/toast';
import { PrecoForm } from './preco-form';

/** Texto de um campo numérico → inteiro não negativo (vazio ou inválido = 0). */
const inteiro = (texto: string) => {
  const valor = Math.floor(Number(texto));
  return Number.isFinite(valor) && valor > 0 ? valor : 0;
};

@Component({
  selector: 'app-precos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, Modal, PrecoForm, CurrencyPipe],
  templateUrl: './precos.html',
  styles: `
    .simulador {
      margin-top: 20px;
      max-width: 720px;
    }
    .simulador h2 {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .simulador__body {
      display: grid;
      gap: 16px;
    }
    .simulador__resultado {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px;
      border-radius: var(--radius-sm);
      background: var(--surface-muted);
    }
    .simulador__resultado strong {
      font-size: 26px;
    }
  `,
})
export default class Precos {
  private readonly api = inject(PrecosApi);
  private readonly toast = inject(ToastService);
  protected readonly session = inject(SessionService);

  protected readonly precos = httpResource<Preco[]>(() => `${API}/precos`);
  protected readonly tipos = TIPOS_VEICULO;
  protected readonly tipo = nomeTipo;
  protected readonly duracao = formatarDuracao;

  // --- Simulador -----------------------------------------------------------------------
  protected readonly simTipo = signal<TipoVeiculo>('CARRO');
  // Guardam o texto digitado: converter a cada tecla reescreveria o campo (ex.: vazio → "0").
  protected readonly simHoras = signal('1');
  protected readonly simMinutos = signal('20');
  protected readonly simulacao = computed(() => {
    const preco = this.precos.value()?.find((p) => p.tipo === this.simTipo());
    const minutos = inteiro(this.simHoras()) * 60 + inteiro(this.simMinutos());
    return preco ? { minutos, ...calcularCobranca(preco, minutos) } : null;
  });

  // --- Edição --------------------------------------------------------------------------
  protected readonly editando = signal<Preco | null>(null);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected editar(preco: Preco) {
    this.erro.set(null);
    this.editando.set(preco);
  }

  protected salvar(valores: Omit<Preco, 'tipo'>) {
    const preco = this.editando();
    if (!preco) return;
    this.salvando.set(true);
    this.erro.set(null);
    this.api.atualizar(preco.tipo, valores).subscribe({
      next: () => {
        this.toast.show(`Preços de ${nomeTipo(preco.tipo).toLowerCase()} atualizados.`);
        this.salvando.set(false);
        this.editando.set(null);
        this.precos.reload();
      },
      error: (e) => {
        this.erro.set(apiErrorMessage(e));
        this.salvando.set(false);
      },
    });
  }
}
