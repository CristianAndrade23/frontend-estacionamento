package com.cristianandrade.estacionamento.preco;

import java.math.BigDecimal;

/** Valor a cobrar por uma permanência e a faixa ("regime") em que ela se encaixa. */
public record Cobranca(BigDecimal valor, String regime) {

    /**
     * Aplica a tabela: até 15, 30, 45 e 60 minutos usam o valor da faixa; acima de 1 hora soma o
     * valor de 60 minutos a cada hora adicional iniciada.
     */
    public static Cobranca calcular(TabelaPreco tabela, long minutos) {
        if (minutos <= 15) return new Cobranca(tabela.getAte15(), "Até 15 min");
        if (minutos <= 30) return new Cobranca(tabela.getAte30(), "15 a 30 min");
        if (minutos <= 45) return new Cobranca(tabela.getAte45(), "30 a 45 min");
        if (minutos <= 60) return new Cobranca(tabela.getAte60(), "45 min a 1 h");
        long horasAdicionais = (minutos - 60 + 59) / 60;
        BigDecimal valor = tabela.getAte60().add(tabela.getHoraAdicional().multiply(BigDecimal.valueOf(horasAdicionais)));
        return new Cobranca(valor, "1 h + " + horasAdicionais + (horasAdicionais == 1 ? " h adicional" : " h adicionais"));
    }
}
