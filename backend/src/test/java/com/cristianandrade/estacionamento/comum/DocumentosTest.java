package com.cristianandrade.estacionamento.comum;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class DocumentosTest {

    @Test
    void aceitaPlacasNoPadraoAntigoEMercosul() {
        assertThat(Documentos.placaValida("ABC-1234")).isTrue();
        assertThat(Documentos.placaValida("abc1d23")).isTrue();
        assertThat(Documentos.normalizarPlaca(" abc-1234 ")).isEqualTo("ABC1234");
    }

    @Test
    void rejeitaPlacasMalFormadas() {
        assertThat(Documentos.placaValida("AB1234")).isFalse();
        assertThat(Documentos.placaValida("ABCD123")).isFalse();
        assertThat(Documentos.placaValida("ABC12D3")).isFalse();
        assertThat(Documentos.placaValida(null)).isFalse();
    }

    @Test
    void validaCpf() {
        assertThat(Documentos.cpfValido("529.982.247-25")).isTrue();
        assertThat(Documentos.cpfValido("529.982.247-26")).isFalse();
        assertThat(Documentos.cpfValido("111.111.111-11")).isFalse();
        assertThat(Documentos.cpfValido("123")).isFalse();
    }

    @Test
    void validaCnpj() {
        assertThat(Documentos.cnpjValido("11.222.333/0001-81")).isTrue();
        assertThat(Documentos.cnpjValido("11.222.333/0001-82")).isFalse();
        assertThat(Documentos.cnpjValido("00.000.000/0000-00")).isFalse();
    }

    @Test
    void completaDigitosVerificadores() {
        assertThat(Documentos.completarCpf("529982247")).isEqualTo("52998224725");
        assertThat(Documentos.completarCnpj("112223330001")).isEqualTo("11222333000181");
    }
}
