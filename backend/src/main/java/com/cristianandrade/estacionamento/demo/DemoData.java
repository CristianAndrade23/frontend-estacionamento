package com.cristianandrade.estacionamento.demo;

import com.cristianandrade.estacionamento.auth.Perfil;
import com.cristianandrade.estacionamento.auth.Usuario;
import com.cristianandrade.estacionamento.auth.UsuarioRepository;
import com.cristianandrade.estacionamento.caixa.Caixa;
import com.cristianandrade.estacionamento.caixa.CaixaRepository;
import com.cristianandrade.estacionamento.comum.Documentos;
import com.cristianandrade.estacionamento.empresa.Empresa;
import com.cristianandrade.estacionamento.empresa.EmpresaRepository;
import com.cristianandrade.estacionamento.patio.FormaPagamento;
import com.cristianandrade.estacionamento.patio.Movimentacao;
import com.cristianandrade.estacionamento.patio.MovimentacaoRepository;
import com.cristianandrade.estacionamento.preco.Cobranca;
import com.cristianandrade.estacionamento.preco.TabelaPreco;
import com.cristianandrade.estacionamento.preco.TabelaPrecoRepository;
import com.cristianandrade.estacionamento.rh.Funcao;
import com.cristianandrade.estacionamento.rh.FuncaoRepository;
import com.cristianandrade.estacionamento.rh.Funcionario;
import com.cristianandrade.estacionamento.rh.FuncionarioRepository;
import com.cristianandrade.estacionamento.veiculo.Marca;
import com.cristianandrade.estacionamento.veiculo.MarcaRepository;
import com.cristianandrade.estacionamento.veiculo.Modelo;
import com.cristianandrade.estacionamento.veiculo.ModeloRepository;
import com.cristianandrade.estacionamento.veiculo.TipoVeiculo;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Dados fictícios de demonstração, gerados de forma determinística a partir de "agora":
 * {@value #DIAS_DE_HISTORICO} dias de caixas e movimentações, o caixa de hoje aberto e
 * veículos no pátio. Usado na inicialização e por POST /api/demo/reset.
 */
@Component
public class DemoData {

    public static final int DIAS_DE_HISTORICO = 45;
    public static final int VAGAS = 40;
    public static final int VEICULOS_NO_PATIO = 17;

    private static final String ADMIN = "Ana Ribeiro";
    private static final String OPERADOR = "Carlos Lima";

    /** Peso de cada hora de entrada (7h às 20h): picos no início da manhã, no almoço e no fim da tarde. */
    private static final int[] PESO_POR_HORA = {3, 8, 7, 5, 5, 7, 7, 5, 4, 5, 7, 8, 5, 3};

    private record M(String nome, TipoVeiculo tipo) {
    }

    private static final TipoVeiculo CARRO = TipoVeiculo.CARRO;
    private static final TipoVeiculo MOTO = TipoVeiculo.MOTO;
    private static final TipoVeiculo CAMINHONETE = TipoVeiculo.CAMINHONETE;

    private static final Map<String, List<M>> MODELOS = new LinkedHashMap<>();

    static {
        MODELOS.put("Chevrolet", List.of(new M("Onix", CARRO), new M("Tracker", CARRO), new M("S10", CAMINHONETE)));
        MODELOS.put("Fiat", List.of(new M("Argo", CARRO), new M("Mobi", CARRO), new M("Strada", CAMINHONETE),
                new M("Toro", CAMINHONETE)));
        MODELOS.put("Volkswagen", List.of(new M("Gol", CARRO), new M("Polo", CARRO), new M("T-Cross", CARRO),
                new M("Amarok", CAMINHONETE)));
        MODELOS.put("Toyota", List.of(new M("Corolla", CARRO), new M("Hilux", CAMINHONETE)));
        MODELOS.put("Hyundai", List.of(new M("HB20", CARRO), new M("Creta", CARRO)));
        MODELOS.put("Honda", List.of(new M("Civic", CARRO), new M("CG 160", MOTO), new M("Biz 125", MOTO),
                new M("CB 500F", MOTO)));
        MODELOS.put("Yamaha", List.of(new M("Fazer 250", MOTO), new M("Factor 150", MOTO)));
        MODELOS.put("Renault", List.of(new M("Kwid", CARRO), new M("Duster", CARRO)));
        MODELOS.put("Ford", List.of(new M("Ranger", CAMINHONETE)));
        MODELOS.put("Jeep", List.of(new M("Renegade", CARRO), new M("Compass", CARRO)));
    }

    private static final String[] FUNCOES = {"Gerente", "Operador de caixa", "Manobrista", "Segurança",
            "Auxiliar de limpeza"};

    /** Nome e índice da função em {@link #FUNCOES}. */
    private static final Object[][] FUNCIONARIOS = {
            {"Ana Ribeiro", 0}, {"Carlos Lima", 1}, {"Juliana Martins", 1}, {"Rafael Souza", 2},
            {"Diego Fernandes", 2}, {"Marcos Pereira", 2}, {"Patrícia Gomes", 3}, {"Roberto Alves", 3},
            {"Sandra Oliveira", 4}, {"Tiago Carvalho", 1}};

    private final UsuarioRepository usuarios;
    private final EmpresaRepository empresa;
    private final TabelaPrecoRepository precos;
    private final MarcaRepository marcas;
    private final ModeloRepository modelos;
    private final FuncaoRepository funcoes;
    private final FuncionarioRepository funcionarios;
    private final CaixaRepository caixas;
    private final MovimentacaoRepository movimentacoes;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    DemoData(UsuarioRepository usuarios, EmpresaRepository empresa, TabelaPrecoRepository precos,
            MarcaRepository marcas, ModeloRepository modelos, FuncaoRepository funcoes,
            FuncionarioRepository funcionarios, CaixaRepository caixas, MovimentacaoRepository movimentacoes,
            PasswordEncoder passwordEncoder, Clock clock) {
        this.usuarios = usuarios;
        this.empresa = empresa;
        this.precos = precos;
        this.marcas = marcas;
        this.modelos = modelos;
        this.funcoes = funcoes;
        this.funcionarios = funcionarios;
        this.caixas = caixas;
        this.movimentacoes = movimentacoes;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    @Transactional
    public void restaurar() {
        limpar();
        Random random = new Random(2019);
        LocalDateTime agora = LocalDateTime.now(clock).truncatedTo(ChronoUnit.MINUTES);

        usuarios.saveAll(List.of(
                new Usuario("admin", passwordEncoder.encode("admin123"), ADMIN, Perfil.ADMIN),
                new Usuario("operador", passwordEncoder.encode("operador123"), OPERADOR, Perfil.OPERADOR)));

        empresa.save(new Empresa("Estaciona Centro Serviços de Estacionamento Ltda.", "Estaciona Centro",
                Documentos.completarCnpj("283746190001"), VAGAS, "Rua dos Andradas, 1200 - Centro Histórico",
                "Porto Alegre", "RS", new BigDecimal("1.49"), new BigDecimal("3.19")));

        Map<TipoVeiculo, TabelaPreco> tabela = precos.saveAll(List.of(
                preco(TipoVeiculo.CARRO, "8.00", "10.00", "15.00", "20.00", "6.00"),
                preco(TipoVeiculo.MOTO, "5.00", "6.00", "8.00", "10.00", "4.00"),
                preco(TipoVeiculo.CAMINHONETE, "10.00", "13.00", "18.00", "24.00", "8.00")))
                .stream().collect(Collectors.toMap(TabelaPreco::getTipo, t -> t));

        Map<TipoVeiculo, List<Modelo>> modelosPorTipo = cadastrarVeiculos();
        cadastrarEquipe(random, agora.toLocalDate());
        gerarMovimento(random, agora, tabela, modelosPorTipo);
    }

    private void limpar() {
        movimentacoes.deleteAllInBatch();
        caixas.deleteAllInBatch();
        funcionarios.deleteAllInBatch();
        funcoes.deleteAllInBatch();
        modelos.deleteAllInBatch();
        marcas.deleteAllInBatch();
        precos.deleteAllInBatch();
        empresa.deleteAllInBatch();
        usuarios.deleteAllInBatch();
    }

    private static TabelaPreco preco(TipoVeiculo tipo, String ate15, String ate30, String ate45, String ate60,
            String hora) {
        return new TabelaPreco(tipo, new BigDecimal(ate15), new BigDecimal(ate30), new BigDecimal(ate45),
                new BigDecimal(ate60), new BigDecimal(hora));
    }

    private Map<TipoVeiculo, List<Modelo>> cadastrarVeiculos() {
        List<Modelo> todos = new ArrayList<>();
        MODELOS.forEach((nomeMarca, lista) -> {
            Marca marca = marcas.save(new Marca(nomeMarca));
            lista.forEach(m -> todos.add(new Modelo(m.nome(), marca, m.tipo())));
        });
        return modelos.saveAll(todos).stream().collect(Collectors.groupingBy(Modelo::getTipo));
    }

    private void cadastrarEquipe(Random random, LocalDate hoje) {
        List<Funcao> lista = new ArrayList<>();
        for (String nome : FUNCOES) lista.add(funcoes.save(new Funcao(nome)));

        List<Funcionario> equipe = new ArrayList<>();
        for (int i = 0; i < FUNCIONARIOS.length; i++) {
            String cpf = Documentos.completarCpf(String.format("%09d", random.nextInt(1_000_000_000)));
            // Dois aniversariantes no mês atual, para o relatório de RH sempre ter o que mostrar.
            int mes = i < 2 ? hoje.getMonthValue() : 1 + random.nextInt(12);
            LocalDate nascimento = LocalDate.of(1970 + random.nextInt(33), mes, 1 + random.nextInt(28));
            LocalDate maisCedo = nascimento.plusYears(18);
            LocalDate admissao = hoje.minusDays(30 + random.nextInt(8 * 365));
            if (admissao.isBefore(maisCedo)) admissao = maisCedo;
            equipe.add(new Funcionario(cpf, (String) FUNCIONARIOS[i][0], nascimento, admissao,
                    lista.get((Integer) FUNCIONARIOS[i][1])));
        }
        funcionarios.saveAll(equipe);
    }

    private void gerarMovimento(Random random, LocalDateTime agora, Map<TipoVeiculo, TabelaPreco> tabela,
            Map<TipoVeiculo, List<Modelo>> modelosPorTipo) {
        List<Movimentacao> lista = new ArrayList<>();
        LocalDate hoje = agora.toLocalDate();

        // Histórico: um caixa por dia, das 7h às 22h, com todas as saídas registradas nele.
        for (int d = DIAS_DE_HISTORICO; d >= 1; d--) {
            LocalDate dia = hoje.minusDays(d);
            String responsavel = d % 2 == 0 ? ADMIN : OPERADOR;
            Caixa caixa = new Caixa(dia.atTime(7, random.nextInt(10)), responsavel, new BigDecimal("150.00"));
            caixa.fechar(dia.atTime(22, random.nextInt(15)), responsavel);
            caixas.save(caixa);

            boolean fimDeSemana = dia.getDayOfWeek().compareTo(DayOfWeek.SATURDAY) >= 0;
            int quantidade = fimDeSemana ? 14 + random.nextInt(14) : 34 + random.nextInt(26);
            LocalDateTime ultimaSaida = dia.atTime(21, 55);
            for (int i = 0; i < quantidade; i++) {
                LocalDateTime entrada = dia.atTime(horaDeEntrada(random), random.nextInt(60))
                        .withSecond(random.nextInt(60));
                if (entrada.isBefore(caixa.getAbertura())) entrada = caixa.getAbertura().plusMinutes(1);
                LocalDateTime saida = entrada.plusMinutes(permanencia(random)).withSecond(random.nextInt(60));
                if (saida.isAfter(ultimaSaida)) saida = ultimaSaida.minusMinutes(random.nextInt(20));
                lista.add(finalizada(random, entrada, saida, caixa, responsavel, tabela, modelosPorTipo));
            }
        }

        // Hoje: caixa aberto há cerca de 5 horas, algumas saídas já registradas e o pátio ocupado.
        LocalDateTime aberturaHoje = agora.minusHours(5).minusMinutes(random.nextInt(30));
        Caixa caixaHoje = caixas.save(new Caixa(aberturaHoje, OPERADOR, new BigDecimal("150.00")));
        long minutosDeCaixa = Duration.between(aberturaHoje, agora).toMinutes();
        for (int i = 0; i < 12; i++) {
            LocalDateTime entrada = aberturaHoje.plusMinutes(random.nextInt((int) minutosDeCaixa - 70));
            LocalDateTime saida = entrada.plusMinutes(8 + random.nextInt(60));
            lista.add(finalizada(random, entrada, saida, caixaHoje, OPERADOR, tabela, modelosPorTipo));
        }

        Set<String> placasNoPatio = new HashSet<>();
        while (placasNoPatio.size() < VEICULOS_NO_PATIO) {
            String placa = placa(random);
            if (!placasNoPatio.add(placa)) continue;
            LocalDateTime entrada = agora.minusMinutes(3 + random.nextInt(240)).withSecond(random.nextInt(60));
            lista.add(new Movimentacao(placa, modelo(random, modelosPorTipo), entrada, OPERADOR));
        }
        movimentacoes.saveAll(lista);
    }

    private Movimentacao finalizada(Random random, LocalDateTime entrada, LocalDateTime saida, Caixa caixa,
            String responsavel, Map<TipoVeiculo, TabelaPreco> tabela, Map<TipoVeiculo, List<Modelo>> modelosPorTipo) {
        Modelo modelo = modelo(random, modelosPorTipo);
        Movimentacao m = new Movimentacao(placa(random), modelo, entrada, responsavel);
        long minutos = Duration.between(entrada, saida).toMinutes();
        m.finalizar(saida, Cobranca.calcular(tabela.get(modelo.getTipo()), minutos).valor(), formaPagamento(random),
                caixa, responsavel);
        return m;
    }

    private static int horaDeEntrada(Random random) {
        int total = 0;
        for (int peso : PESO_POR_HORA) total += peso;
        int sorteio = random.nextInt(total);
        for (int i = 0; i < PESO_POR_HORA.length; i++) {
            sorteio -= PESO_POR_HORA[i];
            if (sorteio < 0) return 7 + i;
        }
        return 20;
    }

    /** Minutos de permanência: um terço até 1 hora, metade entre 1 e 4 horas, o resto até 10 horas. */
    private static long permanencia(Random random) {
        double p = random.nextDouble();
        if (p < 0.35) return 5 + random.nextInt(56);
        if (p < 0.85) return 61 + random.nextInt(180);
        return 241 + random.nextInt(360);
    }

    private static Modelo modelo(Random random, Map<TipoVeiculo, List<Modelo>> modelosPorTipo) {
        double p = random.nextDouble();
        TipoVeiculo tipo = p < 0.70 ? TipoVeiculo.CARRO : p < 0.84 ? TipoVeiculo.MOTO : TipoVeiculo.CAMINHONETE;
        List<Modelo> lista = modelosPorTipo.get(tipo);
        return lista.get(random.nextInt(lista.size()));
    }

    private static FormaPagamento formaPagamento(Random random) {
        double p = random.nextDouble();
        if (p < 0.36) return FormaPagamento.PIX;
        if (p < 0.62) return FormaPagamento.CREDITO;
        if (p < 0.85) return FormaPagamento.DEBITO;
        return FormaPagamento.DINHEIRO;
    }

    /** Placa Mercosul (ABC1D23) em 70% dos casos; no padrão antigo (ABC1234) nos demais. */
    private static String placa(Random random) {
        StringBuilder placa = new StringBuilder();
        for (int i = 0; i < 3; i++) placa.append((char) ('A' + random.nextInt(26)));
        placa.append(random.nextInt(10));
        placa.append(random.nextDouble() < 0.7 ? (char) ('A' + random.nextInt(26)) : (char) ('0' + random.nextInt(10)));
        placa.append(String.format("%02d", random.nextInt(100)));
        return placa.toString();
    }
}
