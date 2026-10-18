import { calcularCobranca, faixasDecrescentes } from './cobranca';
import { Preco } from './models';

const carro: Preco = { tipo: 'CARRO', ate15: 8, ate30: 10, ate45: 15, ate60: 20, horaAdicional: 6 };

describe('calcularCobranca', () => {
  it.each([
    [0, 8, 'Até 15 min'],
    [15, 8, 'Até 15 min'],
    [16, 10, '15 a 30 min'],
    [45, 15, '30 a 45 min'],
    [60, 20, '45 min a 1 h'],
    [61, 26, '1 h + 1 h adicional'],
    [121, 32, '1 h + 2 h adicionais'],
  ])('%i min custa R$ %d (%s)', (minutos, valor, regime) => {
    expect(calcularCobranca(carro, minutos)).toEqual({ valor, regime });
  });

  it('detecta faixas fora de ordem', () => {
    expect(faixasDecrescentes(carro)).toBe(false);
    expect(faixasDecrescentes({ ...carro, ate45: 9 })).toBe(true);
  });
});
