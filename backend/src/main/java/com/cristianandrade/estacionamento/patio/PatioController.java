package com.cristianandrade.estacionamento.patio;

import com.cristianandrade.estacionamento.comum.Pagina;
import com.cristianandrade.estacionamento.comum.Validacoes.Placa;
import com.cristianandrade.estacionamento.patio.PatioService.Situacao;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/movimentacoes")
public class PatioController {

    public record EntradaRequest(@NotBlank(message = "Informe a placa") @Placa String placa,
            @NotNull(message = "Selecione o modelo") Long modeloId) {
    }

    public record SaidaRequest(@NotNull(message = "Selecione a forma de pagamento") FormaPagamento formaPagamento) {
    }

    private final PatioService service;

    PatioController(PatioService service) {
        this.service = service;
    }

    @GetMapping
    public Pagina<MovimentacaoDto> listar(@RequestParam(defaultValue = "PATIO") Situacao situacao,
            @RequestParam(defaultValue = "") String busca, @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "10") int tamanho) {
        return service.listar(situacao, busca, pagina, tamanho);
    }

    @PostMapping("/entrada")
    @ResponseStatus(HttpStatus.CREATED)
    public MovimentacaoDto entrada(@Valid @RequestBody EntradaRequest request, @AuthenticationPrincipal Jwt jwt) {
        return service.registrarEntrada(request.placa(), request.modeloId(), jwt.getClaimAsString("nome"));
    }

    @GetMapping("/{id}/previa-saida")
    public MovimentacaoDto previaSaida(@PathVariable Long id) {
        return service.previaSaida(id);
    }

    @PostMapping("/{id}/saida")
    public MovimentacaoDto saida(@PathVariable Long id, @Valid @RequestBody SaidaRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return service.registrarSaida(id, request.formaPagamento(), jwt.getClaimAsString("nome"));
    }
}
