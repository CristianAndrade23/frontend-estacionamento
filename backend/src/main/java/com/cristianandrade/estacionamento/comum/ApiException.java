package com.cristianandrade.estacionamento.comum;

import org.springframework.http.HttpStatus;

/** Erro de regra de negócio com o status HTTP e a mensagem que o painel mostra ao usuário. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public static ApiException naoEncontrado(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, message);
    }

    public static ApiException conflito(String message) {
        return new ApiException(HttpStatus.CONFLICT, message);
    }

    public static ApiException invalido(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }
}
