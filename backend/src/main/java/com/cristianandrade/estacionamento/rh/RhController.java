package com.cristianandrade.estacionamento.rh;

import com.cristianandrade.estacionamento.comum.Validacoes.Cpf;
import com.cristianandrade.estacionamento.rh.RhService.DadosFuncionario;
import com.cristianandrade.estacionamento.rh.RhService.FuncaoDto;
import com.cristianandrade.estacionamento.rh.RhService.FuncionarioDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class RhController {

    public record FuncaoRequest(
            @NotBlank(message = "Informe o nome da função") @Size(max = 40, message = "Máximo de 40 caracteres") String nome) {
    }

    public record FuncionarioRequest(
            @NotBlank(message = "Informe o CPF") @Cpf String cpf,
            @NotBlank(message = "Informe o nome") @Size(min = 3, max = 80, message = "Entre 3 e 80 caracteres") String nome,
            @NotNull(message = "Informe a data de nascimento") @Past(message = "A data de nascimento deve estar no passado") LocalDate nascimento,
            @NotNull(message = "Informe a data de admissão") @PastOrPresent(message = "A admissão não pode ser no futuro") LocalDate admissao,
            @NotNull(message = "Selecione a função") Long funcaoId) {

        DadosFuncionario dados() {
            return new DadosFuncionario(cpf, nome, nascimento, admissao, funcaoId);
        }
    }

    private final RhService service;

    RhController(RhService service) {
        this.service = service;
    }

    @GetMapping("/funcoes")
    public List<FuncaoDto> funcoes() {
        return service.listarFuncoes();
    }

    @PostMapping("/funcoes")
    @ResponseStatus(HttpStatus.CREATED)
    public FuncaoDto criarFuncao(@Valid @RequestBody FuncaoRequest request) {
        return service.criarFuncao(request.nome());
    }

    @PutMapping("/funcoes/{id}")
    public FuncaoDto atualizarFuncao(@PathVariable Long id, @Valid @RequestBody FuncaoRequest request) {
        return service.atualizarFuncao(id, request.nome());
    }

    @DeleteMapping("/funcoes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluirFuncao(@PathVariable Long id) {
        service.excluirFuncao(id);
    }

    @GetMapping("/funcionarios")
    public List<FuncionarioDto> funcionarios() {
        return service.listarFuncionarios();
    }

    @PostMapping("/funcionarios")
    @ResponseStatus(HttpStatus.CREATED)
    public FuncionarioDto criarFuncionario(@Valid @RequestBody FuncionarioRequest request) {
        return service.criarFuncionario(request.dados());
    }

    @PutMapping("/funcionarios/{id}")
    public FuncionarioDto atualizarFuncionario(@PathVariable Long id, @Valid @RequestBody FuncionarioRequest request) {
        return service.atualizarFuncionario(id, request.dados());
    }

    @DeleteMapping("/funcionarios/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluirFuncionario(@PathVariable Long id) {
        service.excluirFuncionario(id);
    }
}
