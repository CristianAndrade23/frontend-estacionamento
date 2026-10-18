package com.cristianandrade.estacionamento.comum;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Map;

/** Corpo de toda resposta de erro da API: `message` legível e, em validações, o erro de cada campo. */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ErroResponse(int status, String message, Map<String, String> campos) {

    public ErroResponse(int status, String message) {
        this(status, message, Map.of());
    }
}
