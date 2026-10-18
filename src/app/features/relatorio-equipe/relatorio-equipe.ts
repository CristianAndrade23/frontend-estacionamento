import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { API } from '../../core/api/api';
import { percentual } from '../../core/formato';
import { Funcionario } from '../../core/models';
import { BarChart, BarDatum } from '../../shared/bar-chart';
import { Icon } from '../../shared/icon';
import { estatisticasDaEquipe, formatarMeses } from './equipe-stats';

const mesAtual = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date());

@Component({
  selector: 'app-relatorio-equipe',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BarChart, Icon],
  templateUrl: './relatorio-equipe.html',
  styles: `
    .kpi__value--texto {
      font-size: 20px;
    }
    .aniversariantes {
      margin-top: 20px;
    }
  `,
})
export default class RelatorioEquipePage {
  protected readonly funcionarios = httpResource<Funcionario[]>(() => `${API}/funcionarios`);
  protected readonly stats = computed(() => estatisticasDaEquipe(this.funcionarios.value() ?? []));
  protected readonly mes = mesAtual;
  protected readonly meses = formatarMeses;

  protected readonly porFuncao = computed<BarDatum[]>(() =>
    this.stats().porFuncao.map((f) => ({
      label: f.nome,
      value: f.quantidade,
      detail: percentual(f.quantidade, this.stats().total),
    })),
  );

  protected readonly tempoDeCasa = computed<BarDatum[]>(() =>
    this.stats().tempoDeCasa.map((f) => ({
      label: f.nome,
      value: f.quantidade,
      detail: percentual(f.quantidade, this.stats().total),
    })),
  );
}
