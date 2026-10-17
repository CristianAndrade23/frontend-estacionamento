const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const moedaCompacta = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const inteiro = new Intl.NumberFormat('pt-BR');

/** R$ 1.234,50 */
export const brl = (valor: number) => moeda.format(valor);
/** R$ 1,2 mil (eixos de gráfico) */
export const brlCompacto = (valor: number) => moedaCompacta.format(valor);
/** 1.234 */
export const numero = (valor: number) => inteiro.format(valor);
/** 12,5% */
export const percentual = (parte: number, total: number) =>
  total > 0 ? `${((parte / total) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '0%';
