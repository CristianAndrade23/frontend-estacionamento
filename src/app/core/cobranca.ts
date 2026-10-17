import { Preco } from './models';

/**
 * Mesma regra do backend (`preco/Cobranca.java`), usada no simulador da tela de preços:
 * até 15, 30, 45 e 60 minutos cobram o valor da faixa; acima de 1 hora soma a hora adicional
 * a cada hora iniciada.
 */
export function calcularCobranca(preco: Preco, minutos: number): { valor: number; regime: string } {
  if (minutos <= 15) return { valor: preco.ate15, regime: 'Até 15 min' };
  if (minutos <= 30) return { valor: preco.ate30, regime: '15 a 30 min' };
  if (minutos <= 45) return { valor: preco.ate45, regime: '30 a 45 min' };
  if (minutos <= 60) return { valor: preco.ate60, regime: '45 min a 1 h' };
  const horas = Math.ceil((minutos - 60) / 60);
  return {
    valor: Math.round((preco.ate60 + preco.horaAdicional * horas) * 100) / 100,
    regime: `1 h + ${horas} ${horas === 1 ? 'h adicional' : 'h adicionais'}`,
  };
}

/** Faixas que ficaram mais baratas que a anterior (a tabela precisa ser crescente). */
export function faixasDecrescentes(p: Pick<Preco, 'ate15' | 'ate30' | 'ate45' | 'ate60'>): boolean {
  return p.ate30 < p.ate15 || p.ate45 < p.ate30 || p.ate60 < p.ate45;
}
