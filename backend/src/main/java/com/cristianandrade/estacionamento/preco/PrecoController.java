package com.cristianandrade.estacionamento.preco;

import com.cristianandrade.estacionamento.comum.ApiException;
import com.cristianandrade.estacionamento.veiculo.TipoVeiculo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/precos")
public class PrecoController {

    public record PrecoDto(TipoVeiculo tipo, BigDecimal ate15, BigDecimal ate30, BigDecimal ate45, BigDecimal ate60,
            BigDecimal horaAdicional) {
        static PrecoDto de(TabelaPreco t) {
            return new PrecoDto(t.getTipo(), t.getAte15(), t.getAte30(), t.getAte45(), t.getAte60(),
                    t.getHoraAdicional());
        }
    }

    public record PrecoRequest(
            @NotNull(message = "Informe o valor até 15 min") @DecimalMin("0.00") @DecimalMax("9999.99") @Digits(integer = 4, fraction = 2) BigDecimal ate15,
            @NotNull(message = "Informe o valor até 30 min") @DecimalMin("0.00") @DecimalMax("9999.99") @Digits(integer = 4, fraction = 2) BigDecimal ate30,
            @NotNull(message = "Informe o valor até 45 min") @DecimalMin("0.00") @DecimalMax("9999.99") @Digits(integer = 4, fraction = 2) BigDecimal ate45,
            @NotNull(message = "Informe o valor até 1 h") @DecimalMin("0.00") @DecimalMax("9999.99") @Digits(integer = 4, fraction = 2) BigDecimal ate60,
            @NotNull(message = "Informe o valor da hora adicional") @DecimalMin("0.00") @DecimalMax("9999.99") @Digits(integer = 4, fraction = 2) BigDecimal horaAdicional) {
    }

    private final TabelaPrecoRepository repository;

    PrecoController(TabelaPrecoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<PrecoDto> listar() {
        return repository.findAll().stream()
                .sorted(Comparator.comparing(TabelaPreco::getTipo))
                .map(PrecoDto::de)
                .toList();
    }

    @PutMapping("/{tipo}")
    @Transactional
    public PrecoDto atualizar(@PathVariable TipoVeiculo tipo, @Valid @RequestBody PrecoRequest request) {
        List<BigDecimal> faixas = List.of(request.ate15(), request.ate30(), request.ate45(), request.ate60());
        for (int i = 1; i < faixas.size(); i++) {
            if (faixas.get(i).compareTo(faixas.get(i - 1)) < 0) {
                throw ApiException.invalido("O valor de cada faixa não pode ser menor que o da faixa anterior");
            }
        }
        TabelaPreco tabela = repository.findById(tipo)
                .orElseThrow(() -> ApiException.naoEncontrado("Tabela de preço não encontrada"));
        tabela.atualizar(request.ate15(), request.ate30(), request.ate45(), request.ate60(), request.horaAdicional());
        return PrecoDto.de(tabela);
    }
}
