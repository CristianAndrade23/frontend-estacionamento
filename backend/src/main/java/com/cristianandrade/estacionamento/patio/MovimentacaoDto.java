package com.cristianandrade.estacionamento.patio;

import com.cristianandrade.estacionamento.veiculo.TipoVeiculo;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Movimentação para o painel. Enquanto o veículo está no pátio, `permanenciaMinutos`, `regime` e
 * `valor` são calculados até o momento da consulta (é o que ele pagaria se saísse agora).
 */
public record MovimentacaoDto(Long id, String placa, ModeloResumo modelo, LocalDateTime entrada,
        LocalDateTime saida, long permanenciaMinutos, String regime, BigDecimal valor,
        FormaPagamento formaPagamento, boolean noPatio, String registradaPor, String finalizadaPor) {

    public record ModeloResumo(Long id, String nome, String marca, TipoVeiculo tipo) {
    }
}
