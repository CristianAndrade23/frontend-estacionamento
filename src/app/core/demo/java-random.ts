const MULTIPLICADOR = 0x5deece66dn;
const MASCARA = (1n << 48n) - 1n;

/**
 * Cópia exata do `java.util.Random` (gerador congruencial linear de 48 bits, algoritmo definido
 * na documentação do Java). Com a mesma semente, produz a mesma sequência que o backend, então
 * o modo demo gera os mesmos dados de demonstração que o `DemoData.java`.
 */
export class JavaRandom {
  private semente: bigint;

  constructor(semente: number) {
    this.semente = (BigInt(semente) ^ MULTIPLICADOR) & MASCARA;
  }

  private next(bits: number): number {
    this.semente = (this.semente * MULTIPLICADOR + 0xbn) & MASCARA;
    // Como o `(int)` do Java: os bits mais altos, interpretados como inteiro de 32 bits com sinal.
    return Number(BigInt.asIntN(32, this.semente >> BigInt(48 - bits)));
  }

  /** Inteiro uniforme em [0, limite). */
  nextInt(limite: number): number {
    let r = this.next(31);
    const m = limite - 1;
    if ((limite & m) === 0) return Number((BigInt(limite) * BigInt(r)) >> 31n);
    // Rejeita os valores do fim do intervalo que causariam viés (o `< 0` detecta o estouro do int).
    for (let u = r; ((u - (r = u % limite) + m) | 0) < 0; u = this.next(31));
    return r;
  }

  /** Double uniforme em [0, 1). */
  nextDouble(): number {
    return (this.next(26) * 2 ** 27 + this.next(27)) * 2 ** -53;
  }
}
