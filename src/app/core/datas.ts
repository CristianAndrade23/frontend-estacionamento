/** Datas como a API usa: `aaaa-mm-dd` (dia) e ISO local sem fuso (`aaaa-mm-ddThh:mm:ss`). */

const pad = (n: number) => String(n).padStart(2, '0');

/** Date → `aaaa-mm-dd` no fuso local. */
export const isoDia = (data: Date) =>
  `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`;

/** `aaaa-mm-dd` → Date à meia-noite local (sem o deslocamento de fuso de `new Date('aaaa-mm-dd')`). */
export function dia(iso: string): Date {
  const [ano, mes, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(ano, mes - 1, d);
}

export function somarDias(data: Date, dias: number): Date {
  const copia = new Date(data);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

/** Duração legível: 45 min · 1 h 05 · 3 h. */
export function formatarDuracao(minutos: number): string {
  const m = Math.max(0, Math.round(minutos));
  if (m < 60) return `${m} min`;
  const horas = Math.floor(m / 60);
  const resto = m % 60;
  return resto === 0 ? `${horas} h` : `${horas} h ${pad(resto)}`;
}

/** Anos completos entre duas datas (idade, tempo de casa). */
export function anosCompletos(de: Date, ate: Date): number {
  let anos = ate.getFullYear() - de.getFullYear();
  const aindaNaoFez =
    ate.getMonth() < de.getMonth() || (ate.getMonth() === de.getMonth() && ate.getDate() < de.getDate());
  if (aindaNaoFez) anos--;
  return anos;
}

export type PresetPeriodo = 'hoje' | '7d' | '30d' | 'mes' | 'mes-anterior';

export const PRESETS_PERIODO: readonly { valor: PresetPeriodo; nome: string }[] = [
  { valor: 'hoje', nome: 'Hoje' },
  { valor: '7d', nome: 'Últimos 7 dias' },
  { valor: '30d', nome: 'Últimos 30 dias' },
  { valor: 'mes', nome: 'Mês atual' },
  { valor: 'mes-anterior', nome: 'Mês anterior' },
];

/** Intervalo (inclusivo) de um atalho de período, relativo a `hoje`. */
export function periodoDoPreset(preset: PresetPeriodo, hoje = new Date()): { de: string; ate: string } {
  switch (preset) {
    case 'hoje':
      return { de: isoDia(hoje), ate: isoDia(hoje) };
    case '7d':
      return { de: isoDia(somarDias(hoje, -6)), ate: isoDia(hoje) };
    case '30d':
      return { de: isoDia(somarDias(hoje, -29)), ate: isoDia(hoje) };
    case 'mes':
      return { de: isoDia(new Date(hoje.getFullYear(), hoje.getMonth(), 1)), ate: isoDia(hoje) };
    case 'mes-anterior':
      return {
        de: isoDia(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)),
        ate: isoDia(new Date(hoje.getFullYear(), hoje.getMonth(), 0)),
      };
  }
}
