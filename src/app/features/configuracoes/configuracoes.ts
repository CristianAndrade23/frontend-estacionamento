import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API, EmpresaApi } from '../../core/api/api';
import { apiErrorMessage } from '../../core/api/api-error';
import { Dashboard, Empresa } from '../../core/models';
import { Icon } from '../../shared/icon';
import { ToastService } from '../../shared/toast';
import { EmpresaForm } from './empresa-form';

@Component({
  selector: 'app-configuracoes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmpresaForm, Icon],
  template: `
    <header class="page-header">
      <div>
        <h1>Configurações</h1>
        <p class="text-muted">Dados do estacionamento, capacidade e taxas usadas no relatório financeiro.</p>
      </div>
    </header>

    <section class="card config">
      <div class="card__body">
        @if (empresa.error()) {
          <div class="alert alert--danger">
            <app-icon name="alert" />
            Não foi possível carregar as configurações.
            <button type="button" class="link" (click)="empresa.reload()">Tentar novamente</button>
          </div>
        } @else if (!empresa.hasValue()) {
          <p class="text-muted">Carregando…</p>
        } @else {
          <app-empresa-form
            [empresa]="empresa.value()"
            [ocupadas]="resumo.value()?.ocupadas ?? 0"
            [erro]="erro()"
            [salvar]="salvar"
          />
        }
      </div>
    </section>
  `,
  styles: `
    .config {
      max-width: 860px;
    }
  `,
})
export default class Configuracoes {
  private readonly api = inject(EmpresaApi);
  private readonly toast = inject(ToastService);

  protected readonly empresa = httpResource<Empresa>(() => `${API}/empresa`);
  protected readonly resumo = httpResource<Dashboard>(() => `${API}/dashboard`);
  protected readonly erro = signal<string | null>(null);

  protected readonly salvar = async (dados: Empresa) => {
    this.erro.set(null);
    try {
      await firstValueFrom(this.api.atualizar(dados));
      this.toast.show('Configurações salvas.');
    } catch (e) {
      this.erro.set(apiErrorMessage(e));
    }
  };
}
