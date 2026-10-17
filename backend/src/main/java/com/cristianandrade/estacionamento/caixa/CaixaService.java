package com.cristianandrade.estacionamento.caixa;

import com.cristianandrade.estacionamento.comum.ApiException;
import com.cristianandrade.estacionamento.comum.Periodo;
import com.cristianandrade.estacionamento.patio.FormaPagamento;
import com.cristianandrade.estacionamento.patio.MovimentacaoRepository;
import com.cristianandrade.estacionamento.patio.MovimentacaoRepository.TotalPorCaixa;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CaixaService {

    private final CaixaRepository caixas;
    private final MovimentacaoRepository movimentacoes;
    private final Clock clock;

    CaixaService(CaixaRepository caixas, MovimentacaoRepository movimentacoes, Clock clock) {
        this.caixas = caixas;
        this.movimentacoes = movimentacoes;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public Optional<CaixaDto> atual() {
        return caixas.findFirstByFechamentoIsNull().map(c -> resumir(List.of(c)).getFirst());
    }

    /** Caixa aberto, exigido para registrar saídas do pátio. */
    @Transactional(readOnly = true)
    public Caixa exigirAberto() {
        return caixas.findFirstByFechamentoIsNull()
                .orElseThrow(() -> ApiException.conflito("Abra o caixa antes de registrar saídas"));
    }

    public CaixaDto abrir(BigDecimal valorInicial, String usuario) {
        if (caixas.findFirstByFechamentoIsNull().isPresent()) {
            throw ApiException.conflito("Já existe um caixa aberto");
        }
        Caixa caixa = caixas.save(new Caixa(agora(), usuario, valorInicial));
        return resumir(List.of(caixa)).getFirst();
    }

    public CaixaDto fechar(String usuario) {
        Caixa caixa = caixas.findFirstByFechamentoIsNull()
                .orElseThrow(() -> ApiException.conflito("Não há caixa aberto"));
        caixa.fechar(agora(), usuario);
        return resumir(List.of(caixa)).getFirst();
    }

    /** Caixas abertos no período (datas inclusivas), do mais recente para o mais antigo. */
    @Transactional(readOnly = true)
    public List<CaixaDto> listar(Periodo periodo) {
        return resumir(caixas.findByAberturaGreaterThanEqualAndAberturaLessThanOrderByAberturaDesc(
                periodo.inicio(), periodo.fim()));
    }

    private List<CaixaDto> resumir(List<Caixa> lista) {
        if (lista.isEmpty()) return List.of();
        Map<Long, List<TotalPorCaixa>> totais = movimentacoes
                .totaisPorCaixa(lista.stream().map(Caixa::getId).toList()).stream()
                .collect(Collectors.groupingBy(TotalPorCaixa::getCaixaId));

        return lista.stream().map(caixa -> {
            Map<FormaPagamento, TotalPorCaixa> porForma = totais.getOrDefault(caixa.getId(), List.of()).stream()
                    .collect(Collectors.toMap(TotalPorCaixa::getForma, t -> t));
            // Todas as formas aparecem, mesmo zeradas, para o painel montar a tabela sem lacunas.
            List<CaixaDto.TotalForma> formas = Arrays.stream(FormaPagamento.values())
                    .map(f -> Optional.ofNullable(porForma.get(f))
                            .map(t -> new CaixaDto.TotalForma(f, t.getQuantidade(), t.getValor()))
                            .orElse(new CaixaDto.TotalForma(f, 0, BigDecimal.ZERO)))
                    .toList();
            long saidas = formas.stream().mapToLong(CaixaDto.TotalForma::quantidade).sum();
            BigDecimal total = formas.stream().map(CaixaDto.TotalForma::valor).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal dinheiro = formas.stream().filter(f -> f.forma() == FormaPagamento.DINHEIRO)
                    .map(CaixaDto.TotalForma::valor).findFirst().orElse(BigDecimal.ZERO);
            return new CaixaDto(caixa.getId(), caixa.getAbertura(), caixa.getFechamento(), caixa.getAbertoPor(),
                    caixa.getFechadoPor(), caixa.getValorInicial(), saidas, total,
                    caixa.getValorInicial().add(dinheiro), formas);
        }).toList();
    }

    private LocalDateTime agora() {
        return LocalDateTime.now(clock).truncatedTo(ChronoUnit.SECONDS);
    }
}
