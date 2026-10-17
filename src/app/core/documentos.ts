/**
 * Placa, CPF e CNPJ: validação (mesmas regras do backend, `comum/Documentos.java`), máscaras de
 * digitação e formatação para exibição.
 */

export const somenteDigitos = (valor: string) => valor.replace(/\D/g, '');

/** Remove hífen e espaços e passa para maiúsculas. */
export const normalizarPlaca = (placa: string) => placa.replace(/[\s-]/g, '').toUpperCase();

/** Padrão antigo (ABC1234) ou Mercosul (ABC1D23). */
export const placaValida = (placa: string) => /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(normalizarPlaca(placa));

/** ABC1234 → ABC-1234 (padrão antigo); placas Mercosul ficam sem hífen. */
export function formatarPlaca(placa: string): string {
  const p = normalizarPlaca(placa);
  return p.length === 7 && /\d/.test(p[4]) ? `${p.slice(0, 3)}-${p.slice(3)}` : p;
}

/** Máscara de digitação: só letras e números, maiúsculas, até 7 caracteres, hífen no padrão antigo. */
export function mascararPlaca(valor: string): string {
  const p = valor
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 7);
  return p.length > 4 && /\d/.test(p[4]) ? `${p.slice(0, 3)}-${p.slice(3)}` : p;
}

function digitoCpf(d: string, quantidade: number, pesoInicial: number) {
  let soma = 0;
  for (let i = 0; i < quantidade; i++) soma += Number(d[i]) * (pesoInicial - i);
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

export function cpfValido(cpf: string): boolean {
  const d = somenteDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  return digitoCpf(d, 9, 10) === Number(d[9]) && digitoCpf(d, 10, 11) === Number(d[10]);
}

function digitoCnpj(d: string, pesos: number[]) {
  const soma = pesos.reduce((acc, peso, i) => acc + Number(d[i]) * peso, 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function cnpjValido(cnpj: string): boolean {
  const d = somenteDigitos(cnpj);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  return (
    digitoCnpj(d, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[12]) &&
    digitoCnpj(d, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[13])
  );
}

/** Aplica uma máscara com `#` nas posições de dígito, parando no último dígito digitado. */
function mascarar(valor: string, mascara: string): string {
  const digitos = somenteDigitos(valor);
  let saida = '';
  let i = 0;
  for (const c of mascara) {
    if (i >= digitos.length) break;
    saida += c === '#' ? digitos[i++] : c;
  }
  return saida;
}

export const mascararCpf = (valor: string) => mascarar(valor, '###.###.###-##');
export const mascararCnpj = (valor: string) => mascarar(valor, '##.###.###/####-##');
