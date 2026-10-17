package com.cristianandrade.estacionamento.relatorio;

import com.cristianandrade.estacionamento.caixa.CaixaDto;
import com.cristianandrade.estacionamento.caixa.CaixaService;
import com.cristianandrade.estacionamento.comum.Periodo;
import com.cristianandrade.estacionamento.empresa.EmpresaRepository;
import com.cristianandrade.estacionamento.relatorio.RelatorioService.Financeiro;
import com.cristianandrade.estacionamento.relatorio.RelatorioService.Operacional;
import com.cristianandrade.estacionamento.relatorio.RelatorioService.QuantidadePorTipo;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class RelatorioController {

    /** Resumo da tela inicial: ocupação agora e o movimento de hoje. */
    public record Dashboard(int vagas, long ocupadas, long livres, List<QuantidadePorTipo> noPatioPorTipo,
            long entradasHoje, long saidasHoje, BigDecimal faturamentoHoje, long permanenciaMediaHojeMinutos,
            List<Long> entradasPorHoraHoje, CaixaDto caixa) {
    }

    private final RelatorioService service;
    private final CaixaService caixaService;
    private final EmpresaRepository empresa;
    private final Clock clock;

    RelatorioController(RelatorioService service, CaixaService caixaService, EmpresaRepository empresa, Clock clock) {
        this.service = service;
        this.caixaService = caixaService;
        this.empresa = empresa;
        this.clock = clock;
    }

    @GetMapping("/relatorios/operacional")
    public Operacional operacional(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate de,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ate) {
        return service.operacional(new Periodo(de, ate));
    }

    @GetMapping("/relatorios/financeiro")
    public Financeiro financeiro(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate de,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ate) {
        return service.financeiro(new Periodo(de, ate));
    }

    @GetMapping("/dashboard")
    public Dashboard dashboard() {
        Periodo hoje = new Periodo(LocalDate.now(clock), LocalDate.now(clock));
        Operacional operacional = service.operacional(hoje);
        Financeiro financeiro = service.financeiro(hoje);
        List<QuantidadePorTipo> noPatio = service.noPatioPorTipo();
        long ocupadas = noPatio.stream().mapToLong(QuantidadePorTipo::quantidade).sum();
        int vagas = empresa.obter().getVagas();
        return new Dashboard(vagas, ocupadas, Math.max(0, vagas - ocupadas), noPatio, operacional.entradas(),
                financeiro.pagamentos(), financeiro.receitaBruta(), operacional.permanenciaMediaMinutos(),
                operacional.porHora(), caixaService.atual().orElse(null));
    }
}
