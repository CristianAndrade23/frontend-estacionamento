import { anosCompletos, dia } from '../../core/datas';
import { Funcionario } from '../../core/models';

export const FAIXAS_TEMPO_DE_CASA = [
  { nome: 'Menos de 1 ano', ate: 1 },
  { nome: '1 a 3 anos', ate: 3 },
  { nome: '3 a 5 anos', ate: 5 },
  { nome: '5 anos ou mais', ate: Infinity },
] as const;

/** Indicadores da equipe calculados a partir da lista de funcionários. Função pura, testada à parte. */
export function estatisticasDaEquipe(funcionarios: Funcionario[], hoje = new Date()) {
  const anos = (iso: string) => anosCompletos(dia(iso), hoje);
  const meses = (iso: string) => {
    const d = dia(iso);
    return (hoje.getFullYear() - d.getFullYear()) * 12 + hoje.getMonth() - d.getMonth();
  };
  const media = (valores: number[]) =>
    valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;

  const porFuncao = new Map<string, number>();
  for (const f of funcionarios) porFuncao.set(f.funcao.nome, (porFuncao.get(f.funcao.nome) ?? 0) + 1);

  const tempoDeCasa = FAIXAS_TEMPO_DE_CASA.map((faixa, i) => {
    const de = i === 0 ? 0 : FAIXAS_TEMPO_DE_CASA[i - 1].ate;
    return {
      nome: faixa.nome,
      quantidade: funcionarios.filter((f) => anos(f.admissao) >= de && anos(f.admissao) < faixa.ate).length,
    };
  });

  const aniversariantes = funcionarios
    .filter((f) => dia(f.nascimento).getMonth() === hoje.getMonth())
    .map((f) => ({
      funcionario: f,
      dia: dia(f.nascimento).getDate(),
      // Idade que completa no aniversário deste ano.
      idade: hoje.getFullYear() - dia(f.nascimento).getFullYear(),
    }))
    .sort((a, b) => a.dia - b.dia);

  return {
    total: funcionarios.length,
    idadeMedia: Math.round(media(funcionarios.map((f) => anos(f.nascimento)))),
    tempoMedioMeses: Math.round(media(funcionarios.map((f) => meses(f.admissao)))),
    porFuncao: [...porFuncao]
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade || a.nome.localeCompare(b.nome)),
    tempoDeCasa,
    aniversariantes,
  };
}

/** 14 meses → "1 ano e 2 meses". */
export function formatarMeses(total: number): string {
  const anos = Math.floor(total / 12);
  const meses = total % 12;
  const partes = [
    anos ? `${anos} ${anos === 1 ? 'ano' : 'anos'}` : '',
    meses ? `${meses} ${meses === 1 ? 'mês' : 'meses'}` : '',
  ].filter(Boolean);
  return partes.join(' e ') || 'menos de 1 mês';
}
