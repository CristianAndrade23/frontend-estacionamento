import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { API, RhApi } from '../../core/api/api';
import { apiErrorMessage } from '../../core/api/api-error';
import { mascararCpf } from '../../core/documentos';
import { Funcao, Funcionario, FuncionarioRequest } from '../../core/models';
import { Icon } from '../../shared/icon';
import { Modal } from '../../shared/modal';
import { NomeForm } from '../../shared/nome-form';
import { Paginator, paginate } from '../../shared/paginator';
import { matches } from '../../shared/text';
import { ToastService } from '../../shared/toast';
import { FuncionarioForm } from './funcionario-form';

type Edicao =
  { tipo: 'funcao'; funcao: Funcao | null } | { tipo: 'funcionario'; funcionario: Funcionario | null };
type Exclusao = { tipo: 'funcao'; item: Funcao } | { tipo: 'funcionario'; item: Funcionario };

@Component({
  selector: 'app-equipe',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, Modal, NomeForm, FuncionarioForm, Paginator, DatePipe],
  templateUrl: './equipe.html',
})
export default class Equipe {
  private readonly api = inject(RhApi);
  private readonly toast = inject(ToastService);

  protected readonly funcoes = httpResource<Funcao[]>(() => `${API}/funcoes`);
  protected readonly funcionarios = httpResource<Funcionario[]>(() => `${API}/funcionarios`);
  protected readonly cpf = mascararCpf;

  protected readonly tamanho = 10;
  protected readonly busca = signal('');
  /** Busca por nome ou função; se o texto tiver números, também pelo CPF. */
  protected readonly filtrados = computed(() => {
    const busca = this.busca().trim();
    const digitos = busca.replace(/\D/g, '');
    return (this.funcionarios.value() ?? []).filter(
      (f) =>
        !busca || matches(`${f.nome} ${f.funcao.nome}`, busca) || (digitos !== '' && f.cpf.includes(digitos)),
    );
  });
  protected readonly pagina = linkedSignal({ source: this.busca, computation: () => 1 });
  protected readonly daPagina = computed(() => paginate(this.filtrados(), this.pagina(), this.tamanho));

  // --- Criar / editar ------------------------------------------------------------------
  protected readonly edicao = signal<Edicao | null>(null);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly tituloEdicao = computed(() => {
    const e = this.edicao();
    if (e?.tipo === 'funcao') return e.funcao ? 'Editar função' : 'Nova função';
    return e?.funcionario ? 'Editar funcionário' : 'Novo funcionário';
  });

  protected readonly nomesDeFuncoes = computed(() => {
    const e = this.edicao();
    const atual = e?.tipo === 'funcao' ? e.funcao?.nome : undefined;
    return (this.funcoes.value() ?? []).map((f) => f.nome).filter((n) => n !== atual);
  });

  protected editar(edicao: Edicao) {
    this.erro.set(null);
    this.edicao.set(edicao);
  }

  protected salvarFuncao(nome: string) {
    const e = this.edicao();
    if (e?.tipo !== 'funcao') return;
    this.executar(this.api.salvarFuncao(e.funcao?.id ?? null, nome), `Função ${nome} salva.`);
  }

  protected salvarFuncionario(body: FuncionarioRequest) {
    const e = this.edicao();
    if (e?.tipo !== 'funcionario') return;
    this.executar(
      this.api.salvarFuncionario(e.funcionario?.id ?? null, body),
      `Funcionário ${body.nome.split(' ')[0]} salvo.`,
    );
  }

  private executar(chamada: Observable<unknown>, sucesso: string) {
    this.salvando.set(true);
    this.erro.set(null);
    chamada.subscribe({
      next: () => {
        this.toast.show(sucesso);
        this.salvando.set(false);
        this.edicao.set(null);
        this.funcoes.reload();
        this.funcionarios.reload();
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
    const chamada =
      e.tipo === 'funcao' ? this.api.excluirFuncao(e.item.id) : this.api.excluirFuncionario(e.item.id);
    chamada.subscribe({
      next: () => {
        this.toast.show(
          e.tipo === 'funcao' ? `Função ${e.item.nome} excluída.` : `Funcionário ${e.item.nome} excluído.`,
          'info',
        );
        this.salvando.set(false);
        this.exclusao.set(null);
        this.funcoes.reload();
        this.funcionarios.reload();
      },
      error: (err) => {
        this.toast.error(apiErrorMessage(err));
        this.salvando.set(false);
        this.exclusao.set(null);
      },
    });
  }
}
