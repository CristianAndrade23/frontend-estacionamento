import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { API, VeiculosApi } from '../../core/api/api';
import { apiErrorMessage } from '../../core/api/api-error';
import { Marca, Modelo, ModeloRequest, nomeTipo } from '../../core/models';
import { Icon } from '../../shared/icon';
import { Modal } from '../../shared/modal';
import { NomeForm } from '../../shared/nome-form';
import { Paginator, paginate } from '../../shared/paginator';
import { matches } from '../../shared/text';
import { ToastService } from '../../shared/toast';
import { ModeloForm } from './modelo-form';

type Edicao = { tipo: 'marca'; marca: Marca | null } | { tipo: 'modelo'; modelo: Modelo | null };
type Exclusao = { tipo: 'marca'; item: Marca } | { tipo: 'modelo'; item: Modelo };

@Component({
  selector: 'app-veiculos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, Modal, NomeForm, ModeloForm, Paginator],
  templateUrl: './veiculos.html',
})
export default class Veiculos {
  private readonly api = inject(VeiculosApi);
  private readonly toast = inject(ToastService);

  protected readonly marcas = httpResource<Marca[]>(() => `${API}/marcas`);
  protected readonly modelos = httpResource<Modelo[]>(() => `${API}/modelos`);
  protected readonly tipo = nomeTipo;

  // --- Filtro de modelos ---------------------------------------------------------------
  protected readonly tamanho = 10;
  protected readonly busca = signal('');
  protected readonly marcaFiltro = signal<number | null>(null);
  protected readonly modelosFiltrados = computed(() =>
    (this.modelos.value() ?? []).filter(
      (m) =>
        (this.marcaFiltro() === null || m.marca.id === this.marcaFiltro()) &&
        (!this.busca() || matches(`${m.nome} ${m.marca.nome}`, this.busca())),
    ),
  );
  protected readonly pagina = linkedSignal({
    source: () => [this.busca(), this.marcaFiltro()],
    computation: () => 1,
  });
  protected readonly modelosDaPagina = computed(() =>
    paginate(this.modelosFiltrados(), this.pagina(), this.tamanho),
  );

  protected filtrarMarca(valor: string) {
    this.marcaFiltro.set(valor ? Number(valor) : null);
  }

  // --- Criar / editar ------------------------------------------------------------------
  protected readonly edicao = signal<Edicao | null>(null);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly tituloEdicao = computed(() => {
    const e = this.edicao();
    if (e?.tipo === 'marca') return e.marca ? 'Editar marca' : 'Nova marca';
    return e?.modelo ? 'Editar modelo' : 'Novo modelo';
  });

  protected readonly nomesDeMarcas = computed(() => {
    const e = this.edicao();
    const atual = e?.tipo === 'marca' ? e.marca?.nome : undefined;
    return (this.marcas.value() ?? []).map((m) => m.nome).filter((n) => n !== atual);
  });

  protected editar(edicao: Edicao) {
    this.erro.set(null);
    this.edicao.set(edicao);
  }

  protected salvarMarca(nome: string) {
    const e = this.edicao();
    if (e?.tipo !== 'marca') return;
    this.executar(this.api.salvarMarca(e.marca?.id ?? null, nome), `Marca ${nome} salva.`);
  }

  protected salvarModelo(body: ModeloRequest) {
    const e = this.edicao();
    if (e?.tipo !== 'modelo') return;
    this.executar(this.api.salvarModelo(e.modelo?.id ?? null, body), `Modelo ${body.nome} salvo.`);
  }

  private executar(chamada: Observable<unknown>, sucesso: string) {
    this.salvando.set(true);
    this.erro.set(null);
    chamada.subscribe({
      next: () => {
        this.toast.show(sucesso);
        this.salvando.set(false);
        this.edicao.set(null);
        this.marcas.reload();
        this.modelos.reload();
      },
      error: (e) => {
        this.erro.set(apiErrorMessage(e));
        this.salvando.set(false);
      },
    });
  }

  // --- Excluir -------------------------------------------------------------------------
  protected readonly exclusao = signal<Exclusao | null>(null);

  protected confirmarExclusao() {
    const e = this.exclusao();
    if (!e) return;
    this.salvando.set(true);
    const chamada = e.tipo === 'marca' ? this.api.excluirMarca(e.item.id) : this.api.excluirModelo(e.item.id);
    chamada.subscribe({
      next: () => {
        this.toast.show(
          e.tipo === 'marca' ? `Marca ${e.item.nome} excluída.` : `Modelo ${e.item.nome} excluído.`,
          'info',
        );
        this.salvando.set(false);
        this.exclusao.set(null);
        this.marcas.reload();
        this.modelos.reload();
      },
      error: (err) => {
        // Ex.: marca com modelos ou modelo com movimentações — a API explica o motivo.
        this.toast.error(apiErrorMessage(err));
        this.salvando.set(false);
        this.exclusao.set(null);
      },
    });
  }
}
