package com.cristianandrade.estacionamento.relatorio;

import com.cristianandrade.estacionamento.comum.Periodo;
import com.cristianandrade.estacionamento.empresa.Empresa;
import com.cristianandrade.estacionamento.empresa.EmpresaRepository;
import com.cristianandrade.estacionamento.patio.FormaPagamento;
import com.cristianandrade.estacionamento.patio.Movimentacao;
import com.cristianandrade.estacionamento.patio.MovimentacaoRepository;
import com.cristianandrade.estacionamento.veiculo.Modelo;
import com.cristianandrade.estacionamento.veiculo.TipoVeiculo;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class RelatorioService {

    public record QuantidadePorTipo(TipoVeiculo tipo, long quantidade) {
    }

    public record QuantidadePorDia(LocalDate data, long quantidade) {
    }

    public record ModeloMaisFrequente(String modelo, String marca, TipoVeiculo tipo, long quantidade) {
    }

    /** Movimento do pátio pelas entradas no período. */
    public record Operacional(Periodo periodo, long entradas, long finalizadas, long permanenciaMediaMinutos,
            List<QuantidadePorTipo> porTipo, List<Long> porHora, List<QuantidadePorDia> porDia,
            List<ModeloMaisFrequente> modelos) {
    }

    public record ReceitaPorForma(FormaPagamento forma, long quantidade, BigDecimal valor, BigDecimal taxa) {
    }

    public record ReceitaPorTipo(TipoVeiculo tipo, long quantidade, BigDecimal valor) {
    }

    public record ReceitaPorDia(LocalDate data, BigDecimal valor) {
    }

    /** Receita pelas saídas (pagamentos) no período, com as taxas de cartão da empresa. */
    public record Financeiro(Periodo periodo, long pagamentos, BigDecimal receitaBruta, BigDecimal taxas,
            BigDecimal receitaLiquida, BigDecimal ticketMedio, List<ReceitaPorForma> porForma,
            List<ReceitaPorTipo> porTipo, List<ReceitaPorDia> porDia) {
    }

    private static final BigDecimal CEM = BigDecimal.valueOf(100);

    private final MovimentacaoRepository movimentacoes;
    private final EmpresaRepository empresa;

    RelatorioService(MovimentacaoRepository movimentacoes, EmpresaRepository empresa) {
        this.movimentacoes = movimentacoes;
        this.empresa = empresa;
    }

    public Operacional operacional(Periodo periodo) {
        List<Movimentacao> lista = movimentacoes.findByEntradaGreaterThanEqualAndEntradaLessThan(periodo.inicio(),
                periodo.fim());
        List<Movimentacao> finalizadas = lista.stream().filter(m -> !m.isNoPatio()).toList();
        long permanenciaMedia = Math.round(finalizadas.stream()
                .mapToLong(m -> Duration.between(m.getEntrada(), m.getSaida()).toMinutes())
                .average().orElse(0));

        Map<TipoVeiculo, Long> porTipo = lista.stream()
                .collect(Collectors.groupingBy(m -> m.getModelo().getTipo(), Collectors.counting()));
        Long[] porHora = new Long[24];
        Arrays.fill(porHora, 0L);
        lista.forEach(m -> porHora[m.getEntrada().getHour()]++);
        Map<LocalDate, Long> porDia = lista.stream()
                .collect(Collectors.groupingBy(m -> m.getEntrada().toLocalDate(), Collectors.counting()));

        Map<Long, List<Movimentacao>> porModelo = lista.stream()
                .collect(Collectors.groupingBy(m -> m.getModelo().getId()));
        List<ModeloMaisFrequente> modelos = porModelo.values().stream()
                .map(doModelo -> {
                    Modelo modelo = doModelo.getFirst().getModelo();
                    return new ModeloMaisFrequente(modelo.getNome(), modelo.getMarca().getNome(), modelo.getTipo(),
                            doModelo.size());
                })
                .sorted(Comparator.comparingLong(ModeloMaisFrequente::quantidade).reversed()
                        .thenComparing(ModeloMaisFrequente::modelo))
                .limit(5)
                .toList();

        return new Operacional(periodo, lista.size(), finalizadas.size(), permanenciaMedia,
                Arrays.stream(TipoVeiculo.values())
                        .map(t -> new QuantidadePorTipo(t, porTipo.getOrDefault(t, 0L))).toList(),
                List.of(porHora),
                periodo.de().datesUntil(periodo.ate().plusDays(1))
                        .map(d -> new QuantidadePorDia(d, porDia.getOrDefault(d, 0L))).toList(),
                modelos);
    }

    public Financeiro financeiro(Periodo periodo) {
        List<Movimentacao> pagas = movimentacoes.findBySaidaGreaterThanEqualAndSaidaLessThan(periodo.inicio(),
                periodo.fim());
        Empresa dados = empresa.obter();
        Map<FormaPagamento, BigDecimal> taxaPercentual = Map.of(
                FormaPagamento.DEBITO, dados.getTaxaDebito(),
                FormaPagamento.CREDITO, dados.getTaxaCredito());

        List<ReceitaPorForma> porForma = Arrays.stream(FormaPagamento.values()).map(forma -> {
            List<Movimentacao> daForma = pagas.stream().filter(m -> m.getFormaPagamento() == forma).toList();
            BigDecimal valor = somar(daForma);
            BigDecimal taxa = valor.multiply(taxaPercentual.getOrDefault(forma, BigDecimal.ZERO))
                    .divide(CEM, 2, RoundingMode.HALF_UP);
            return new ReceitaPorForma(forma, daForma.size(), valor, taxa);
        }).sorted(Comparator.comparing(ReceitaPorForma::valor).reversed()).toList();

        Map<TipoVeiculo, List<Movimentacao>> porTipo = pagas.stream()
                .collect(Collectors.groupingBy(m -> m.getModelo().getTipo()));
        Map<LocalDate, BigDecimal> porDia = pagas.stream().collect(Collectors.groupingBy(
                m -> m.getSaida().toLocalDate(), Collectors.reducing(BigDecimal.ZERO, Movimentacao::getValor,
                        BigDecimal::add)));

        BigDecimal bruta = somar(pagas);
        BigDecimal taxas = porForma.stream().map(ReceitaPorForma::taxa).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal ticketMedio = pagas.isEmpty() ? BigDecimal.ZERO
                : bruta.divide(BigDecimal.valueOf(pagas.size()), 2, RoundingMode.HALF_UP);

        return new Financeiro(periodo, pagas.size(), bruta, taxas, bruta.subtract(taxas), ticketMedio, porForma,
                Arrays.stream(TipoVeiculo.values()).map(t -> {
                    List<Movimentacao> doTipo = porTipo.getOrDefault(t, List.of());
                    return new ReceitaPorTipo(t, doTipo.size(), somar(doTipo));
                }).toList(),
                periodo.de().datesUntil(periodo.ate().plusDays(1))
                        .map(d -> new ReceitaPorDia(d, porDia.getOrDefault(d, BigDecimal.ZERO))).toList());
    }

    private static BigDecimal somar(List<Movimentacao> lista) {
        return lista.stream().map(Movimentacao::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Agrupa os veículos que estão no pátio por tipo. */
    public List<QuantidadePorTipo> noPatioPorTipo() {
        Map<TipoVeiculo, Long> porTipo = movimentacoes.findBySaidaIsNull().stream()
                .collect(Collectors.groupingBy(m -> m.getModelo().getTipo(), Collectors.counting()));
        return Arrays.stream(TipoVeiculo.values())
                .map(t -> new QuantidadePorTipo(t, porTipo.getOrDefault(t, 0L)))
                .toList();
    }
}
