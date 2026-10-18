import { Funcionario } from '../../core/models';
import { estatisticasDaEquipe, formatarMeses } from './equipe-stats';

const pessoa = (id: number, funcao: string, nascimento: string, admissao: string): Funcionario => ({
  id,
  nome: `Pessoa ${id}`,
  cpf: '00000000000',
  nascimento,
  admissao,
  funcao: { id: funcao.length, nome: funcao },
});

describe('estatisticasDaEquipe', () => {
  const hoje = new Date(2026, 9, 17); // 17/10/2026
  const equipe = [
    pessoa(1, 'Manobrista', '1990-10-25', '2026-03-01'), // 36 anos, < 1 ano de casa, aniversário em outubro
    pessoa(2, 'Manobrista', '2000-01-10', '2023-10-17'), // 26 anos, 3 anos de casa
    pessoa(3, 'Gerente', '1980-10-02', '2015-05-20'), // 46 anos, 11 anos de casa, aniversário em outubro
  ];

  it('conta por função, do maior para o menor', () => {
    expect(estatisticasDaEquipe(equipe, hoje).porFuncao).toEqual([
      { nome: 'Manobrista', quantidade: 2 },
      { nome: 'Gerente', quantidade: 1 },
    ]);
  });

  it('agrupa o tempo de casa por faixas', () => {
    expect(estatisticasDaEquipe(equipe, hoje).tempoDeCasa.map((f) => f.quantidade)).toEqual([1, 0, 1, 1]);
  });

  it('lista os aniversariantes do mês em ordem de dia', () => {
    const { aniversariantes } = estatisticasDaEquipe(equipe, hoje);
    expect(aniversariantes.map((a) => [a.funcionario.id, a.dia, a.idade])).toEqual([
      [3, 2, 46],
      [1, 25, 36],
    ]);
  });

  it('calcula a idade média em anos completos', () => {
    // 35 (ainda não fez aniversário), 26 e 46
    expect(estatisticasDaEquipe(equipe, hoje).idadeMedia).toBe(36);
  });
});

describe('formatarMeses', () => {
  it('escreve anos e meses por extenso', () => {
    expect(formatarMeses(0)).toBe('menos de 1 mês');
    expect(formatarMeses(1)).toBe('1 mês');
    expect(formatarMeses(14)).toBe('1 ano e 2 meses');
    expect(formatarMeses(36)).toBe('3 anos');
  });
});
