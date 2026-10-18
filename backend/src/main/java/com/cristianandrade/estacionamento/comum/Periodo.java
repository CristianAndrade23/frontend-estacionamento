package com.cristianandrade.estacionamento.comum;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/** Intervalo de datas inclusivo vindo de filtros (`?de=2026-10-01&ate=2026-10-31`). */
public record Periodo(LocalDate de, LocalDate ate) {

    public Periodo {
        if (de == null || ate == null) throw ApiException.invalido("Informe o período");
        if (ate.isBefore(de)) throw ApiException.invalido("A data final não pode ser antes da inicial");
        if (ChronoUnit.DAYS.between(de, ate) > 366) throw ApiException.invalido("Escolha um período de até 1 ano");
    }

    /** Início do primeiro dia. */
    public LocalDateTime inicio() {
        return de.atStartOfDay();
    }

    /** Início do dia seguinte ao último (limite exclusivo). */
    public LocalDateTime fim() {
        return ate.plusDays(1).atStartOfDay();
    }
}
