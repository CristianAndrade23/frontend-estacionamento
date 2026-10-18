import {
  cnpjValido,
  cpfValido,
  formatarPlaca,
  mascararCnpj,
  mascararCpf,
  mascararPlaca,
  placaValida,
} from './documentos';

describe('documentos', () => {
  it('valida placas no padrão antigo e Mercosul', () => {
    expect(placaValida('abc-1234')).toBe(true);
    expect(placaValida('ABC1D23')).toBe(true);
    expect(placaValida('AB-1234')).toBe(false);
    expect(placaValida('ABC12D3')).toBe(false);
  });

  it('formata a placa para exibição', () => {
    expect(formatarPlaca('ABC1234')).toBe('ABC-1234');
    expect(formatarPlaca('ABC1D23')).toBe('ABC1D23');
  });

  it('mascara a placa durante a digitação', () => {
    expect(mascararPlaca('abc')).toBe('ABC');
    expect(mascararPlaca('abc12')).toBe('ABC-12');
    expect(mascararPlaca('abc1d2')).toBe('ABC1D2');
    expect(mascararPlaca('a b c 1 2 3 4 5')).toBe('ABC-1234');
  });

  it('valida CPF e CNPJ pelos dígitos verificadores', () => {
    expect(cpfValido('529.982.247-25')).toBe(true);
    expect(cpfValido('529.982.247-24')).toBe(false);
    expect(cpfValido('000.000.000-00')).toBe(false);
    expect(cnpjValido('11.222.333/0001-81')).toBe(true);
    expect(cnpjValido('11.222.333/0001-80')).toBe(false);
  });

  it('mascara CPF e CNPJ conforme a digitação', () => {
    expect(mascararCpf('5299822')).toBe('529.982.2');
    expect(mascararCpf('52998224725999')).toBe('529.982.247-25');
    expect(mascararCnpj('11222333000181')).toBe('11.222.333/0001-81');
  });
});
