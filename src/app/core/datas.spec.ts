import { anosCompletos, dia, formatarDuracao, isoDia, periodoDoPreset } from './datas';

describe('datas', () => {
  it('converte entre Date e aaaa-mm-dd sem deslocar o fuso', () => {
    expect(isoDia(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(dia('2026-01-05').getDate()).toBe(5);
    expect(dia('2026-01-05T23:10:00').getMonth()).toBe(0);
  });

  it('formata durações', () => {
    expect(formatarDuracao(0)).toBe('0 min');
    expect(formatarDuracao(45)).toBe('45 min');
    expect(formatarDuracao(65)).toBe('1 h 05');
    expect(formatarDuracao(180)).toBe('3 h');
  });

  it('conta anos completos considerando o aniversário', () => {
    expect(anosCompletos(new Date(2000, 5, 10), new Date(2026, 5, 9))).toBe(25);
    expect(anosCompletos(new Date(2000, 5, 10), new Date(2026, 5, 10))).toBe(26);
  });

  it('calcula os atalhos de período', () => {
    const hoje = new Date(2026, 2, 15); // 15/03/2026
    expect(periodoDoPreset('hoje', hoje)).toEqual({ de: '2026-03-15', ate: '2026-03-15' });
    expect(periodoDoPreset('7d', hoje)).toEqual({ de: '2026-03-09', ate: '2026-03-15' });
    expect(periodoDoPreset('mes', hoje)).toEqual({ de: '2026-03-01', ate: '2026-03-15' });
    expect(periodoDoPreset('mes-anterior', hoje)).toEqual({ de: '2026-02-01', ate: '2026-02-28' });
  });

  it('mês anterior atravessa a virada do ano', () => {
    expect(periodoDoPreset('mes-anterior', new Date(2026, 0, 10))).toEqual({
      de: '2025-12-01',
      ate: '2025-12-31',
    });
  });
});
