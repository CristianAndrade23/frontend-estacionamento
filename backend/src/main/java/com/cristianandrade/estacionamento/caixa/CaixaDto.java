package com.cristianandrade.estacionamento.caixa;

import com.cristianandrade.estacionamento.patio.FormaPagamento;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Caixa com os totais recebidos.
 *
 * @param dinheiroEmGaveta troco inicial + pagamentos em dinheiro: o que deve haver na gaveta no fechamento
 */
public record CaixaDto(Long id, LocalDateTime abertura, LocalDateTime fechamento, String abertoPor,
        String fechadoPor, BigDecimal valorInicial, long saidas, BigDecimal totalRecebido,
        BigDecimal dinheiroEmGaveta, List<TotalForma> porForma) {

    public record TotalForma(FormaPagamento forma, long quantidade, BigDecimal valor) {
    }
}
