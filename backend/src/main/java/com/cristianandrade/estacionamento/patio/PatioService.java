package com.cristianandrade.estacionamento.patio;

import com.cristianandrade.estacionamento.caixa.Caixa;
import com.cristianandrade.estacionamento.caixa.CaixaService;
import com.cristianandrade.estacionamento.comum.ApiException;
import com.cristianandrade.estacionamento.comum.Documentos;
import com.cristianandrade.estacionamento.comum.Pagina;
import com.cristianandrade.estacionamento.empresa.EmpresaRepository;
import com.cristianandrade.estacionamento.preco.Cobranca;
import com.cristianandrade.estacionamento.preco.TabelaPreco;
import com.cristianandrade.estacionamento.preco.TabelaPrecoRepository;
import com.cristianandrade.estacionamento.veiculo.Modelo;
import com.cristianandrade.estacionamento.veiculo.ModeloRepository;
import com.cristianandrade.estacionamento.veiculo.TipoVeiculo;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PatioService {

    public enum Situacao {
        /** Só os veículos que ainda estão no pátio. */
        PATIO,
        /** Histórico completo. */
        TODAS
    }

    private final MovimentacaoRepository movimentacoes;
    private final ModeloRepository modelos;
    private final TabelaPrecoRepository precos;
    private final EmpresaRepository empresa;
    private final CaixaService caixaService;
    private final Clock clock;

    PatioService(MovimentacaoRepository movimentacoes, ModeloRepository modelos, TabelaPrecoRepository precos,
            EmpresaRepository empresa, CaixaService caixaService, Clock clock) {
        this.movimentacoes = movimentacoes;
        this.modelos = modelos;
        this.precos = precos;
        this.empresa = empresa;
        this.caixaService = caixaService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public Pagina<MovimentacaoDto> listar(Situacao situacao, String busca, int pagina, int tamanho) {
        String placa = Documentos.normalizarPlaca(busca);
        PageRequest page = PageRequest.of(Math.max(pagina, 0), Math.clamp(tamanho, 1, 50),
                Sort.by(Sort.Direction.DESC, "entrada"));
        Page<Movimentacao> resultado = situacao == Situacao.PATIO
                ? movimentacoes.findBySaidaIsNullAndPlacaContaining(placa, page)
                : movimentacoes.findByPlacaContaining(placa, page);
        Map<TipoVeiculo, TabelaPreco> tabela = tabelaDePrecos();
        LocalDateTime agora = agora();
        return Pagina.de(resultado, m -> paraDto(m, tabela, agora));
    }

    public MovimentacaoDto registrarEntrada(String placaInformada, Long modeloId, String usuario) {
        String placa = Documentos.normalizarPlaca(placaInformada);
        if (!Documentos.placaValida(placa)) {
            throw ApiException.invalido("Placa inválida (use ABC-1234 ou ABC1D23)");
        }
        if (movimentacoes.existsByPlacaAndSaidaIsNull(placa)) {
            throw ApiException.conflito("O veículo " + placa + " já está no pátio");
        }
        int vagas = empresa.obter().getVagas();
        if (movimentacoes.countBySaidaIsNull() >= vagas) {
            throw ApiException.conflito("Estacionamento lotado: todas as " + vagas + " vagas estão ocupadas");
        }
        Modelo modelo = modelos.findById(modeloId)
                .orElseThrow(() -> ApiException.invalido("Modelo não encontrado"));
        Movimentacao movimentacao = movimentacoes.save(new Movimentacao(placa, modelo, agora(), usuario));
        return paraDto(movimentacao, tabelaDePrecos(), agora());
    }

    /** Quanto o veículo pagaria se saísse agora. */
    @Transactional(readOnly = true)
    public MovimentacaoDto previaSaida(Long id) {
        Movimentacao movimentacao = noPatio(id);
        return paraDto(movimentacao, tabelaDePrecos(), agora());
    }

    public MovimentacaoDto registrarSaida(Long id, FormaPagamento forma, String usuario) {
        Movimentacao movimentacao = noPatio(id);
        Caixa caixa = caixaService.exigirAberto();
        LocalDateTime saida = agora();
        Map<TipoVeiculo, TabelaPreco> tabela = tabelaDePrecos();
        Cobranca cobranca = Cobranca.calcular(tabela.get(movimentacao.getModelo().getTipo()),
                minutos(movimentacao.getEntrada(), saida));
        movimentacao.finalizar(saida, cobranca.valor(), forma, caixa, usuario);
        return paraDto(movimentacao, tabela, saida);
    }

    private Movimentacao noPatio(Long id) {
        Movimentacao movimentacao = movimentacoes.findById(id)
                .orElseThrow(() -> ApiException.naoEncontrado("Movimentação não encontrada"));
        if (!movimentacao.isNoPatio()) {
            throw ApiException.conflito("A saída do veículo " + movimentacao.getPlaca() + " já foi registrada");
        }
        return movimentacao;
    }

    private Map<TipoVeiculo, TabelaPreco> tabelaDePrecos() {
        return precos.findAll().stream().collect(Collectors.toMap(TabelaPreco::getTipo, Function.identity()));
    }

    private static MovimentacaoDto paraDto(Movimentacao m, Map<TipoVeiculo, TabelaPreco> tabela,
            LocalDateTime agora) {
        Modelo modelo = m.getModelo();
        LocalDateTime fim = m.isNoPatio() ? agora : m.getSaida();
        long minutos = minutos(m.getEntrada(), fim);
        Cobranca cobranca = Cobranca.calcular(tabela.get(modelo.getTipo()), minutos);
        return new MovimentacaoDto(m.getId(), m.getPlaca(),
                new MovimentacaoDto.ModeloResumo(modelo.getId(), modelo.getNome(), modelo.getMarca().getNome(),
                        modelo.getTipo()),
                m.getEntrada(), m.getSaida(), minutos, cobranca.regime(),
                m.isNoPatio() ? cobranca.valor() : m.getValor(), m.getFormaPagamento(), m.isNoPatio(),
                m.getRegistradaPor(), m.getFinalizadaPor());
    }

    static long minutos(LocalDateTime entrada, LocalDateTime saida) {
        return Math.max(0, Duration.between(entrada, saida).toMinutes());
    }

    private LocalDateTime agora() {
        return LocalDateTime.now(clock).truncatedTo(ChronoUnit.SECONDS);
    }
}
