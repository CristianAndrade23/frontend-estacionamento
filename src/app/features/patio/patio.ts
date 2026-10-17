import { CurrencyPipe, DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { API, PatioApi, comParams } from '../../core/api/api';
import { apiErrorMessage } from '../../core/api/api-error';
import { formatarDuracao } from '../../core/datas';
import { formatarPlaca, normalizarPlaca } from '../../core/documentos';
import { Dashboard, FormaPagamento, Movimentacao, Pagina, nomeForma, nomeTipo } from '../../core/models';
import { Icon } from '../../shared/icon';
import { Modal } from '../../shared/modal';
import { Paginator } from '../../shared/paginator';
import { ToastService } from '../../shared/toast';
import { EntradaForm, EntradaRequest } from './entrada-form';
import { SaidaForm } from './saida-form';

type Situacao = 'PATIO' | 'TODAS';

@Component({
  selector: 'app-patio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EntradaForm, SaidaForm, Icon, Modal, Paginator, CurrencyPipe, DatePipe],
  templateUrl: './patio.html',
})
export default class Patio {
  private readonly api = inject(PatioApi);
  private readonly toast = inject(ToastService);

  /** `?acao=entrada` (atalho da tela inicial) abre direto o formulário de entrada. */
  readonly acao = input<string>();

  protected readonly tamanho = 10;
  protected readonly situacao = signal<Situacao>('PATIO');
  protected readonly busca = signal('');
  protected readonly pagina = linkedSignal({
    source: () => [this.situacao(), this.busca()],
    computation: () => 1,
  });

  protected readonly lista = httpResource<Pagina<Movimentacao>>(() =>
    comParams(`${API}/movimentacoes`, {
      situacao: this.situacao(),
      busca: normalizarPlaca(this.busca()),
      pagina: this.pagina() - 1,
      tamanho: this.tamanho,
    }),
  );
  /** Vagas e caixa: o resumo do topo e a checagem de caixa aberto na saída. */
  protected readonly resumo = httpResource<Dashboard>(() => `${API}/dashboard`);
  protected readonly caixaAberto = computed(() => this.resumo.value()?.caixa != null);
  protected readonly lotado = computed(() => this.resumo.value()?.livres === 0);

  protected readonly placa = formatarPlaca;
  protected readonly tipo = nomeTipo;
  protected readonly forma = nomeForma;
  protected readonly duracao = formatarDuracao;

  // --- Entrada ------------------------------------------------------------------------
  protected readonly entradaAberta = signal(false);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected abrirEntrada() {
    this.erro.set(null);
    this.entradaAberta.set(true);
  }

  protected registrarEntrada({ placa, modeloId }: EntradaRequest) {
    this.salvando.set(true);
    this.erro.set(null);
    this.api.registrarEntrada(placa, modeloId).subscribe({
      next: (m) => {
        this.toast.show(`Entrada de ${formatarPlaca(m.placa)} registrada.`);
        this.salvando.set(false);
        this.entradaAberta.set(false);
        this.atualizar();
      },
      error: (e) => {
        this.erro.set(apiErrorMessage(e));
        this.salvando.set(false);
      },
    });
  }

  // --- Saída --------------------------------------------------------------------------
  protected readonly saindo = signal<Movimentacao | null>(null);

  protected abrirSaida(m: Movimentacao) {
    this.erro.set(null);
    this.resumo.reload();
    this.saindo.set(m);
  }

  protected registrarSaida(forma: FormaPagamento) {
    const m = this.saindo();
    if (!m) return;
    this.salvando.set(true);
    this.erro.set(null);
    this.api.registrarSaida(m.id, forma).subscribe({
      next: (final) => {
        this.toast.show(
          `Saída de ${formatarPlaca(final.placa)}: ${final.valor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })} no ${nomeForma(forma).toLowerCase()}.`,
        );
        this.salvando.set(false);
        this.saindo.set(null);
        this.atualizar();
      },
      error: (e) => {
        this.erro.set(apiErrorMessage(e));
        this.salvando.set(false);
      },
    });
  }

  private atualizar() {
    this.lista.reload();
    this.resumo.reload();
  }

  constructor() {
    // No pátio, tempo e valor mudam a cada minuto: recarrega a lista enquanto a tela está aberta.
    const timer = setInterval(() => {
      if (this.situacao() === 'PATIO' && !this.saindo()) this.atualizar();
    }, 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  ngOnInit() {
    if (this.acao() === 'entrada') this.abrirEntrada();
  }
}
