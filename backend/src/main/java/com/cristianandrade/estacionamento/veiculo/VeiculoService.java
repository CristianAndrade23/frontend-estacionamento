package com.cristianandrade.estacionamento.veiculo;

import com.cristianandrade.estacionamento.comum.ApiException;
import com.cristianandrade.estacionamento.patio.MovimentacaoRepository;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Cadastro de marcas e modelos de veículos. */
@Service
@Transactional
public class VeiculoService {

    public record MarcaDto(Long id, String nome, long modelos) {
    }

    public record ModeloDto(Long id, String nome, TipoVeiculo tipo, MarcaRef marca) {
        public record MarcaRef(Long id, String nome) {
        }

        static ModeloDto de(Modelo m) {
            return new ModeloDto(m.getId(), m.getNome(), m.getTipo(),
                    new MarcaRef(m.getMarca().getId(), m.getMarca().getNome()));
        }
    }

    private final MarcaRepository marcas;
    private final ModeloRepository modelos;
    private final MovimentacaoRepository movimentacoes;

    VeiculoService(MarcaRepository marcas, ModeloRepository modelos, MovimentacaoRepository movimentacoes) {
        this.marcas = marcas;
        this.modelos = modelos;
        this.movimentacoes = movimentacoes;
    }

    // --- Marcas --------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<MarcaDto> listarMarcas() {
        Map<Long, Long> quantidade = modelos.contarPorMarca().stream()
                .collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));
        return marcas.findAllByOrderByNomeAsc().stream()
                .map(m -> new MarcaDto(m.getId(), m.getNome(), quantidade.getOrDefault(m.getId(), 0L)))
                .toList();
    }

    public MarcaDto criarMarca(String nome) {
        String limpo = nome.trim();
        if (marcas.existsByNomeIgnoreCase(limpo)) throw ApiException.conflito("Já existe a marca " + limpo);
        Marca marca = marcas.save(new Marca(limpo));
        return new MarcaDto(marca.getId(), marca.getNome(), 0);
    }

    public MarcaDto atualizarMarca(Long id, String nome) {
        String limpo = nome.trim();
        Marca marca = marca(id);
        if (marcas.existsByNomeIgnoreCaseAndIdNot(limpo, id)) throw ApiException.conflito("Já existe a marca " + limpo);
        marca.setNome(limpo);
        return new MarcaDto(marca.getId(), marca.getNome(), modelos.countByMarcaId(id));
    }

    public void excluirMarca(Long id) {
        Marca marca = marca(id);
        long quantidade = modelos.countByMarcaId(id);
        if (quantidade > 0) {
            throw ApiException.conflito("A marca " + marca.getNome() + " tem " + quantidade
                    + (quantidade == 1 ? " modelo cadastrado" : " modelos cadastrados") + "; exclua-os antes");
        }
        marcas.delete(marca);
    }

    private Marca marca(Long id) {
        return marcas.findById(id).orElseThrow(() -> ApiException.naoEncontrado("Marca não encontrada"));
    }

    // --- Modelos -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<ModeloDto> listarModelos() {
        return modelos.findAllByOrderByMarcaNomeAscNomeAsc().stream().map(ModeloDto::de).toList();
    }

    public ModeloDto criarModelo(String nome, Long marcaId, TipoVeiculo tipo) {
        String limpo = nome.trim();
        Marca marca = marcaDoModelo(marcaId);
        if (modelos.existsByMarcaIdAndNomeIgnoreCase(marcaId, limpo)) {
            throw ApiException.conflito("A marca " + marca.getNome() + " já tem o modelo " + limpo);
        }
        return ModeloDto.de(modelos.save(new Modelo(limpo, marca, tipo)));
    }

    public ModeloDto atualizarModelo(Long id, String nome, Long marcaId, TipoVeiculo tipo) {
        String limpo = nome.trim();
        Modelo modelo = modelos.findById(id).orElseThrow(() -> ApiException.naoEncontrado("Modelo não encontrado"));
        Marca marca = marcaDoModelo(marcaId);
        if (modelos.existsByMarcaIdAndNomeIgnoreCaseAndIdNot(marcaId, limpo, id)) {
            throw ApiException.conflito("A marca " + marca.getNome() + " já tem o modelo " + limpo);
        }
        modelo.setNome(limpo);
        modelo.setMarca(marca);
        modelo.setTipo(tipo);
        return ModeloDto.de(modelo);
    }

    public void excluirModelo(Long id) {
        Modelo modelo = modelos.findById(id).orElseThrow(() -> ApiException.naoEncontrado("Modelo não encontrado"));
        if (movimentacoes.existsByModeloId(id)) {
            throw ApiException.conflito("O modelo " + modelo.getNome()
                    + " já tem movimentações no pátio e não pode ser excluído");
        }
        modelos.delete(modelo);
    }

    private Marca marcaDoModelo(Long marcaId) {
        return marcas.findById(marcaId).orElseThrow(() -> ApiException.invalido("Marca não encontrada"));
    }
}
