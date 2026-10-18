/** Valor em reais como o app exibe (R$ 1.234,50), tolerante ao espaço não separável do Intl. */
export function brl(valor: number): RegExp {
  const texto = valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return new RegExp(`R\\$\\s?${texto.replace(/\./g, '\\.')}`);
}

export { formatarPlaca } from '../../src/app/core/documentos';
export { periodoDoPreset } from '../../src/app/core/datas';
export { numero } from '../../src/app/core/formato';
