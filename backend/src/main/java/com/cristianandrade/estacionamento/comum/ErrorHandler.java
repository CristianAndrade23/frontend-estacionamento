package com.cristianandrade.estacionamento.comum;

import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class ErrorHandler {

    private static final Logger log = LoggerFactory.getLogger(ErrorHandler.class);

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ErroResponse> regraDeNegocio(ApiException e) {
        return responder(e.getStatus(), e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErroResponse> validacao(MethodArgumentNotValidException e) {
        Map<String, String> campos = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(f -> campos.putIfAbsent(f.getField(), f.getDefaultMessage()));
        String primeira = campos.values().stream().findFirst().orElse("Dados inválidos");
        return ResponseEntity.badRequest().body(new ErroResponse(400, primeira, campos));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<ErroResponse> corpoInvalido(Exception e) {
        return responder(HttpStatus.BAD_REQUEST, "Requisição inválida");
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ErroResponse> semPermissao(AccessDeniedException e) {
        return responder(HttpStatus.FORBIDDEN, "Seu perfil não tem acesso a este recurso");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<ErroResponse> naoEncontrado(NoResourceFoundException e) {
        return responder(HttpStatus.NOT_FOUND, "Recurso não encontrado");
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ErroResponse> inesperado(Exception e) {
        log.error("Erro inesperado", e);
        return responder(HttpStatus.INTERNAL_SERVER_ERROR, "Erro inesperado no servidor");
    }

    private static ResponseEntity<ErroResponse> responder(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(new ErroResponse(status.value(), message));
    }
}
