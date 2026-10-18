package com.cristianandrade.estacionamento.veiculo;

import com.cristianandrade.estacionamento.veiculo.VeiculoService.MarcaDto;
import com.cristianandrade.estacionamento.veiculo.VeiculoService.ModeloDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class VeiculoController {

    public record MarcaRequest(
            @NotBlank(message = "Informe o nome da marca") @Size(max = 40, message = "Máximo de 40 caracteres") String nome) {
    }

    public record ModeloRequest(
            @NotBlank(message = "Informe o nome do modelo") @Size(max = 40, message = "Máximo de 40 caracteres") String nome,
            @NotNull(message = "Selecione a marca") Long marcaId,
            @NotNull(message = "Selecione o tipo de veículo") TipoVeiculo tipo) {
    }

    private final VeiculoService service;

    VeiculoController(VeiculoService service) {
        this.service = service;
    }

    @GetMapping("/marcas")
    public List<MarcaDto> marcas() {
        return service.listarMarcas();
    }

    @PostMapping("/marcas")
    @ResponseStatus(HttpStatus.CREATED)
    public MarcaDto criarMarca(@Valid @RequestBody MarcaRequest request) {
        return service.criarMarca(request.nome());
    }

    @PutMapping("/marcas/{id}")
    public MarcaDto atualizarMarca(@PathVariable Long id, @Valid @RequestBody MarcaRequest request) {
        return service.atualizarMarca(id, request.nome());
    }

    @DeleteMapping("/marcas/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluirMarca(@PathVariable Long id) {
        service.excluirMarca(id);
    }

    @GetMapping("/modelos")
    public List<ModeloDto> modelos() {
        return service.listarModelos();
    }

    @PostMapping("/modelos")
    @ResponseStatus(HttpStatus.CREATED)
    public ModeloDto criarModelo(@Valid @RequestBody ModeloRequest request) {
        return service.criarModelo(request.nome(), request.marcaId(), request.tipo());
    }

    @PutMapping("/modelos/{id}")
    public ModeloDto atualizarModelo(@PathVariable Long id, @Valid @RequestBody ModeloRequest request) {
        return service.atualizarModelo(id, request.nome(), request.marcaId(), request.tipo());
    }

    @DeleteMapping("/modelos/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluirModelo(@PathVariable Long id) {
        service.excluirModelo(id);
    }
}
