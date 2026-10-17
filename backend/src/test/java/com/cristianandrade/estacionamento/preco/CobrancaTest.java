package com.cristianandrade.estacionamento.preco;

import static org.assertj.core.api.Assertions.assertThat;

import com.cristianandrade.estacionamento.veiculo.TipoVeiculo;
import java.math.BigDecimal;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class CobrancaTest {

    private final TabelaPreco carro = new TabelaPreco(TipoVeiculo.CARRO, new BigDecimal("8.00"),
            new BigDecimal("10.00"), new BigDecimal("15.00"), new BigDecimal("20.00"), new BigDecimal("6.00"));

    @ParameterizedTest(name = "{0} min = R$ {1} ({2})")
    @CsvSource({
            "0, 8.00, Até 15 min",
            "15, 8.00, Até 15 min",
            "16, 10.00, 15 a 30 min",
            "30, 10.00, 15 a 30 min",
            "45, 15.00, 30 a 45 min",
            "60, 20.00, 45 min a 1 h",
            "61, 26.00, 1 h + 1 h adicional",
            "120, 26.00, 1 h + 1 h adicional",
            "121, 32.00, 1 h + 2 h adicionais",
            "600, 74.00, 1 h + 9 h adicionais"
    })
    void cobraPorFaixaEPorHoraAdicionalIniciada(long minutos, String valor, String regime) {
        Cobranca cobranca = Cobranca.calcular(carro, minutos);
        assertThat(cobranca.valor()).isEqualByComparingTo(valor);
        assertThat(cobranca.regime()).isEqualTo(regime);
    }
}
