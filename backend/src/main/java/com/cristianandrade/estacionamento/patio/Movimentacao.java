package com.cristianandrade.estacionamento.patio;

import com.cristianandrade.estacionamento.caixa.Caixa;
import com.cristianandrade.estacionamento.veiculo.Modelo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Passagem de um veículo pelo estacionamento: aberta na entrada, fechada (com valor e pagamento) na saída. */
@Entity
@Table(indexes = {
        @Index(columnList = "saida"),
        @Index(columnList = "entrada"),
        @Index(columnList = "placa")
})
public class Movimentacao {

    @Id
    @GeneratedValue
    private Long id;

    /** Placa normalizada: sem hífen, maiúsculas. */
    @Column(nullable = false, length = 7)
    private String placa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(nullable = false)
    private Modelo modelo;

    @Column(nullable = false)
    private LocalDateTime entrada;

    @Column(nullable = false)
    private String registradaPor;

    private LocalDateTime saida;

    @Column(precision = 10, scale = 2)
    private BigDecimal valor;

    @Enumerated(EnumType.STRING)
    private FormaPagamento formaPagamento;

    @ManyToOne(fetch = FetchType.LAZY)
    private Caixa caixa;

    private String finalizadaPor;

    protected Movimentacao() {
    }

    public Movimentacao(String placa, Modelo modelo, LocalDateTime entrada, String registradaPor) {
        this.placa = placa;
        this.modelo = modelo;
        this.entrada = entrada;
        this.registradaPor = registradaPor;
    }

    public void finalizar(LocalDateTime saida, BigDecimal valor, FormaPagamento formaPagamento, Caixa caixa,
            String finalizadaPor) {
        this.saida = saida;
        this.valor = valor;
        this.formaPagamento = formaPagamento;
        this.caixa = caixa;
        this.finalizadaPor = finalizadaPor;
    }

    public boolean isNoPatio() {
        return saida == null;
    }

    public Long getId() {
        return id;
    }

    public String getPlaca() {
        return placa;
    }

    public Modelo getModelo() {
        return modelo;
    }

    public LocalDateTime getEntrada() {
        return entrada;
    }

    public String getRegistradaPor() {
        return registradaPor;
    }

    public LocalDateTime getSaida() {
        return saida;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public FormaPagamento getFormaPagamento() {
        return formaPagamento;
    }

    public Caixa getCaixa() {
        return caixa;
    }

    public String getFinalizadaPor() {
        return finalizadaPor;
    }
}
