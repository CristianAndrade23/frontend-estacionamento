package com.cristianandrade.estacionamento.caixa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Turno de caixa. Só pode haver um aberto por vez, e as saídas do pátio são registradas nele. */
@Entity
public class Caixa {

    @Id
    @GeneratedValue
    private Long id;

    @Column(nullable = false)
    private LocalDateTime abertura;

    private LocalDateTime fechamento;

    @Column(nullable = false)
    private String abertoPor;

    private String fechadoPor;

    /** Troco disponível na abertura. */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valorInicial;

    protected Caixa() {
    }

    public Caixa(LocalDateTime abertura, String abertoPor, BigDecimal valorInicial) {
        this.abertura = abertura;
        this.abertoPor = abertoPor;
        this.valorInicial = valorInicial;
    }

    public void fechar(LocalDateTime fechamento, String fechadoPor) {
        this.fechamento = fechamento;
        this.fechadoPor = fechadoPor;
    }

    public boolean isAberto() {
        return fechamento == null;
    }

    public Long getId() {
        return id;
    }

    public LocalDateTime getAbertura() {
        return abertura;
    }

    public LocalDateTime getFechamento() {
        return fechamento;
    }

    public String getAbertoPor() {
        return abertoPor;
    }

    public String getFechadoPor() {
        return fechadoPor;
    }

    public BigDecimal getValorInicial() {
        return valorInicial;
    }
}
