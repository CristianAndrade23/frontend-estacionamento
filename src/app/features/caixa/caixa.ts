import { CurrencyPipe, DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormField, FormRoot, form, max, min, validate } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API, CaixaApi, comParams } from '../../core/api/api';
import { apiErrorMessage } from '../../core/api/api-error';
import { formatarDuracao, periodoDoPreset } from '../../core/datas';
import { Caixa, Periodo, nomeForma } from '../../core/models';
import { Field } from '../../shared/field';
import { Icon } from '../../shared/icon';
import { Modal } from '../../shared/modal';
import { PeriodFilter } from '../../shared/period-filter';
import { ToastService } from '../../shared/toast';

@Component({
  selector: 'app-caixa',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormRoot, FormField, Field, Icon, Modal, PeriodFilter, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './caixa.html',
  styles: `
    .card__header h2 {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .caixa__total {
      font-size: 18px;
    }
    .abertura {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .abertura app-field {
      width: 220px;
    }
    .abertura .btn {
      margin-top: 25px;
    }
    .historico {
      margin-top: 20px;
    }
    .historico .card__body {
      padding-bottom: 0;
    }
  `,
})
export default class CaixaPage {
  private readonly api = inject(CaixaApi);
  private readonly toast = inject(ToastService);

  /** 204 (nenhum caixa aberto) chega como `null`. */
  protected readonly atual = httpResource<Caixa | null>(() => `${API}/caixas/atual`);
  protected readonly periodo = signal<Periodo>(periodoDoPreset('7d'));
  protected readonly historico = httpResource<Caixa[]>(() => comParams(`${API}/caixas`, this.periodo()));

  protected readonly forma = nomeForma;
  protected readonly erro = signal<string | null>(null);

  protected readonly abertoHa = computed(() => {
    const caixa = this.atual.value();
    return caixa ? formatarDuracao((Date.now() - new Date(caixa.abertura).getTime()) / 60_000) : '';
  });

  protected readonly totaisHistorico = computed(() => {
    const lista = this.historico.value() ?? [];
    return {
      saidas: lista.reduce((s, c) => s + c.saidas, 0),
      total: lista.reduce((s, c) => s + c.totalRecebido, 0),
    };
  });

  // --- Abrir ---------------------------------------------------------------------------
  private readonly abertura = signal({ valorInicial: 150 });
  protected readonly aberturaForm = form(
    this.abertura,
    (p) => {
      validate(p.valorInicial, ({ value }) =>
        Number.isFinite(value()) ? undefined : { kind: 'required', message: 'Informe o troco inicial' },
      );
      min(p.valorInicial, 0, { message: 'O troco não pode ser negativo' });
      max(p.valorInicial, 99999, { message: 'Valor alto demais' });
    },
    { submission: { action: () => this.abrir() } },
  );

  private async abrir() {
    this.erro.set(null);
    try {
      await firstValueFrom(this.api.abrir(this.abertura().valorInicial));
      this.toast.show('Caixa aberto. Bom turno!');
      this.recarregar();
    } catch (e) {
      this.erro.set(apiErrorMessage(e));
    }
    return undefined;
  }

  // --- Fechar --------------------------------------------------------------------------
  protected readonly fechando = signal(false);
  protected readonly salvando = signal(false);

  protected confirmarFechamento() {
    this.salvando.set(true);
    this.api.fechar().subscribe({
      next: (caixa) => {
        this.toast.show(
          `Caixa fechado com ${caixa.totalRecebido.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })} recebidos.`,
        );
        this.salvando.set(false);
        this.fechando.set(false);
        this.recarregar();
      },
      error: (e) => {
        this.toast.error(apiErrorMessage(e));
        this.salvando.set(false);
      },
    });
  }

  private recarregar() {
    this.atual.reload();
    this.historico.reload();
  }
}
