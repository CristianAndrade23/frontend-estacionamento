import { JavaRandom } from './java-random';

describe('JavaRandom', () => {
  it('reproduz a sequência do java.util.Random do Java 25 com a mesma semente', () => {
    // Saída de `new Random(2019)` no Java 25: nextInt com limites potência de 2, limites comuns
    // e o limite de 1 bilhão usado nos CPFs, seguidos de nextDouble.
    const esperado = [
      0, 675633330, 10, 1, 7, 27, 5, 0, 1392, 46, 0, 2, 705473317, 2, 7, 2, 14, 0, 17, 2571, 219, 0, 8,
      426539182, 0, 42, 3, 26, 6, 17, 1576, 113, 0,
    ];
    const limites = [10, 1_000_000_000, 16, 60, 26, 33, 12, 28, 2920, 240, 1];
    const random = new JavaRandom(2019);

    const inteiros = [0, 1, 2].flatMap(() => limites.map((limite) => random.nextInt(limite)));
    expect(inteiros).toEqual(esperado);
    expect([1, 2, 3, 4].map(() => random.nextDouble())).toEqual([
      0.6536568631378802, 0.5709773118178957, 0.49461612103816766, 0.4754089587859519,
    ]);
  });
});
