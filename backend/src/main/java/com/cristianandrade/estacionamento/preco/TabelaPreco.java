package com.cristianandrade.estacionamento.preco;

import com.cristianandrade.estacionamento.veiculo.TipoVeiculo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import java.math.BigDecimal;

/** Preços de um tipo de veículo: quatro faixas na primeira hora e um valor por hora adicional. */
@Entity
public class TabelaPreco {

    @Id
    @Enumerated(EnumType.STRING)
    private TipoVeiculo tipo;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal ate15;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal ate30;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal ate45;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal ate60;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal horaAdicional;

    protected TabelaPreco() {
    }

    public TabelaPreco(TipoVeiculo tipo, BigDecimal ate15, BigDecimal ate30, BigDecimal ate45, BigDecimal ate60,
            BigDecimal horaAdicional) {
        this.tipo = tipo;
        atualizar(ate15, ate30, ate45, ate60, horaAdicional);
    }

    public void atualizar(BigDecimal ate15, BigDecimal ate30, BigDecimal ate45, BigDecimal ate60,
            BigDecimal horaAdicional) {
        this.ate15 = ate15;
        this.ate30 = ate30;
        this.ate45 = ate45;
        this.ate60 = ate60;
        this.horaAdicional = horaAdicional;
    }

    public TipoVeiculo getTipo() {
        return tipo;
    }

    public BigDecimal getAte15() {
        return ate15;
    }

    public BigDecimal getAte30() {
        return ate30;
    }

    public BigDecimal getAte45() {
        return ate45;
    }

    public BigDecimal getAte60() {
        return ate60;
    }

    public BigDecimal getHoraAdicional() {
        return horaAdicional;
    }
}
