package com.cristianandrade.estacionamento.empresa;

import com.cristianandrade.estacionamento.comum.ApiException;
import com.cristianandrade.estacionamento.comum.Documentos;
import com.cristianandrade.estacionamento.comum.Validacoes.Cnpj;
import com.cristianandrade.estacionamento.patio.MovimentacaoRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/empresa")
public class EmpresaController {

    public record EmpresaDto(String razaoSocial, String nomeFantasia, String cnpj, int vagas, String endereco,
            String cidade, String uf, BigDecimal taxaDebito, BigDecimal taxaCredito) {
        static EmpresaDto de(Empresa e) {
            return new EmpresaDto(e.getRazaoSocial(), e.getNomeFantasia(), e.getCnpj(), e.getVagas(), e.getEndereco(),
                    e.getCidade(), e.getUf(), e.getTaxaDebito(), e.getTaxaCredito());
        }
    }

    public record EmpresaRequest(
            @NotBlank(message = "Informe a razão social") @Size(max = 120) String razaoSocial,
            @NotBlank(message = "Informe o nome fantasia") @Size(max = 60) String nomeFantasia,
            @NotBlank(message = "Informe o CNPJ") @Cnpj String cnpj,
            @NotNull(message = "Informe o número de vagas") @Min(value = 1, message = "Mínimo de 1 vaga") @Max(value = 2000, message = "Máximo de 2000 vagas") Integer vagas,
            @NotBlank(message = "Informe o endereço") @Size(max = 120) String endereco,
            @NotBlank(message = "Informe a cidade") @Size(max = 60) String cidade,
            @NotBlank(message = "Informe a UF") @Pattern(regexp = "[A-Z]{2}", message = "UF inválida") String uf,
            @NotNull(message = "Informe a taxa do débito") @DecimalMin("0.00") @DecimalMax(value = "20.00", message = "Máximo de 20%") @Digits(integer = 2, fraction = 2) BigDecimal taxaDebito,
            @NotNull(message = "Informe a taxa do crédito") @DecimalMin("0.00") @DecimalMax(value = "20.00", message = "Máximo de 20%") @Digits(integer = 2, fraction = 2) BigDecimal taxaCredito) {
    }

    private final EmpresaRepository repository;
    private final MovimentacaoRepository movimentacoes;

    EmpresaController(EmpresaRepository repository, MovimentacaoRepository movimentacoes) {
        this.repository = repository;
        this.movimentacoes = movimentacoes;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public EmpresaDto obter() {
        return EmpresaDto.de(repository.obter());
    }

    @PutMapping
    @Transactional
    public EmpresaDto atualizar(@Valid @RequestBody EmpresaRequest r) {
        long noPatio = movimentacoes.countBySaidaIsNull();
        if (r.vagas() < noPatio) {
            throw ApiException.invalido("Há " + noPatio + " veículos no pátio; o número de vagas não pode ser menor");
        }
        Empresa empresa = repository.obter();
        empresa.atualizar(r.razaoSocial().trim(), r.nomeFantasia().trim(), Documentos.somenteDigitos(r.cnpj()),
                r.vagas(), r.endereco().trim(), r.cidade().trim(), r.uf(), r.taxaDebito(), r.taxaCredito());
        return EmpresaDto.de(empresa);
    }
}
