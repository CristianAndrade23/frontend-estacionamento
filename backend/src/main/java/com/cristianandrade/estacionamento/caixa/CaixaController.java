package com.cristianandrade.estacionamento.caixa;

import com.cristianandrade.estacionamento.comum.Periodo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/caixas")
public class CaixaController {

    public record AberturaRequest(
            @NotNull(message = "Informe o troco inicial") @DecimalMin(value = "0.00", message = "O troco não pode ser negativo") @DecimalMax("99999.99") @Digits(integer = 5, fraction = 2) BigDecimal valorInicial) {
    }

    private final CaixaService service;

    CaixaController(CaixaService service) {
        this.service = service;
    }

    /** Caixa aberto no momento; 204 quando não há nenhum. */
    @GetMapping("/atual")
    public ResponseEntity<CaixaDto> atual() {
        return service.atual().map(ResponseEntity::ok).orElse(ResponseEntity.noContent().build());
    }

    @PostMapping("/abrir")
    public CaixaDto abrir(@Valid @RequestBody AberturaRequest request, @AuthenticationPrincipal Jwt jwt) {
        return service.abrir(request.valorInicial(), jwt.getClaimAsString("nome"));
    }

    @PostMapping("/fechar")
    public CaixaDto fechar(@AuthenticationPrincipal Jwt jwt) {
        return service.fechar(jwt.getClaimAsString("nome"));
    }

    @GetMapping
    public List<CaixaDto> listar(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate de,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ate) {
        return service.listar(new Periodo(de, ate));
    }
}
