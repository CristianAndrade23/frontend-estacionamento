package com.cristianandrade.estacionamento;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cristianandrade.estacionamento.demo.DemoData;
import com.jayway.jsonpath.JsonPath;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/** Testes de ponta a ponta da API (HTTP → Spring Security → serviços → H2), com os dados de demonstração. */
@SpringBootTest
@AutoConfigureMockMvc
class ApiTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    DemoData demoData;

    String admin;

    @BeforeEach
    void restaurarDados() throws Exception {
        demoData.restaurar();
        admin = token("admin", "admin123");
    }

    String token(String username, String password) throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("username", username, "password", password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.token");
    }

    ResultActions chamar(MockHttpServletRequestBuilder request, String token, String body) throws Exception {
        request.header("Authorization", "Bearer " + token);
        if (body != null) request.contentType(MediaType.APPLICATION_JSON).content(body);
        return mvc.perform(request);
    }

    ResultActions chamar(MockHttpServletRequestBuilder request, String token) throws Exception {
        return chamar(request, token, null);
    }

    <T> T ler(ResultActions resultado, String path) throws Exception {
        return JsonPath.read(resultado.andReturn().getResponse().getContentAsString(), path);
    }

    /** JSON simples a partir de pares chave/valor (números e textos). */
    static String json(Map<String, ?> campos) {
        StringBuilder sb = new StringBuilder("{");
        campos.forEach((k, v) -> {
            if (sb.length() > 1) sb.append(',');
            sb.append('"').append(k).append("\":");
            sb.append(v instanceof String ? "\"" + v + "\"" : String.valueOf(v));
        });
        return sb.append('}').toString();
    }

    Integer modeloCarro() throws Exception {
        List<Integer> ids = ler(chamar(get("/api/modelos"), admin), "$[?(@.tipo == 'CARRO')].id");
        return ids.getFirst();
    }

    @Nested
    class Autenticacao {

        @Test
        void recusaCredenciaisInvalidas() throws Exception {
            mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                            .content(json(Map.of("username", "admin", "password", "errada"))))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Usuário ou senha inválidos"));
        }

        @Test
        void exigeTokenNaApi() throws Exception {
            mvc.perform(get("/api/dashboard")).andExpect(status().isUnauthorized());
            chamar(get("/api/dashboard"), "token-invalido").andExpect(status().isUnauthorized());
        }

        @Test
        void retornaUsuarioDoToken() throws Exception {
            chamar(get("/api/auth/me"), admin)
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.perfil").value("ADMIN"))
                    .andExpect(jsonPath("$.nome").value("Ana Ribeiro"));
        }

        @Test
        void operadorNaoAcessaRhNemAlteraPrecos() throws Exception {
            String operador = token("operador", "operador123");
            chamar(get("/api/funcionarios"), operador).andExpect(status().isForbidden());
            chamar(get("/api/relatorios/financeiro?de=2026-01-01&ate=2026-01-31"), operador)
                    .andExpect(status().isForbidden());
            chamar(put("/api/precos/CARRO"), operador, "{}").andExpect(status().isForbidden());
            // ...mas opera o pátio e vê os preços.
            chamar(get("/api/precos"), operador).andExpect(status().isOk());
            chamar(get("/api/movimentacoes"), operador).andExpect(status().isOk());
        }
    }

    @Nested
    class Patio {

        @Test
        void registraEntradaESaidaNoCaixaAberto() throws Exception {
            ResultActions entrada = chamar(post("/api/movimentacoes/entrada"), admin,
                    json(Map.of("placa", "tst-1a23", "modeloId", modeloCarro())))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.placa").value("TST1A23"))
                    .andExpect(jsonPath("$.noPatio").value(true))
                    .andExpect(jsonPath("$.registradaPor").value("Ana Ribeiro"));
            Integer id = ler(entrada, "$.id");
            Number recebidoAntes = ler(chamar(get("/api/caixas/atual"), admin), "$.totalRecebido");

            chamar(post("/api/movimentacoes/" + id + "/saida"), admin, json(Map.of("formaPagamento", "PIX")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.noPatio").value(false))
                    .andExpect(jsonPath("$.regime").value("Até 15 min"))
                    .andExpect(jsonPath("$.valor").value(8.0))
                    .andExpect(jsonPath("$.formaPagamento").value("PIX"));

            Number recebidoDepois = ler(chamar(get("/api/caixas/atual"), admin), "$.totalRecebido");
            org.assertj.core.api.Assertions.assertThat(recebidoDepois.doubleValue())
                    .isEqualTo(recebidoAntes.doubleValue() + 8.0);

            chamar(post("/api/movimentacoes/" + id + "/saida"), admin, json(Map.of("formaPagamento", "PIX")))
                    .andExpect(status().isConflict());
        }

        @Test
        void naoAceitaVeiculoQueJaEstaNoPatio() throws Exception {
            String placa = ler(chamar(get("/api/movimentacoes?situacao=PATIO"), admin), "$.itens[0].placa");
            chamar(post("/api/movimentacoes/entrada"), admin, json(Map.of("placa", placa, "modeloId", modeloCarro())))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message").value(containsString("já está no pátio")));
        }

        @Test
        void validaAPlaca() throws Exception {
            chamar(post("/api/movimentacoes/entrada"), admin, json(Map.of("placa", "12-ABC", "modeloId", modeloCarro())))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.campos.placa").exists());
        }

        @Test
        void exigeCaixaAbertoParaSaida() throws Exception {
            chamar(post("/api/caixas/fechar"), admin).andExpect(status().isOk());
            chamar(get("/api/caixas/atual"), admin).andExpect(status().isNoContent());
            Integer id = ler(chamar(get("/api/movimentacoes?situacao=PATIO"), admin), "$.itens[0].id");

            chamar(post("/api/movimentacoes/" + id + "/saida"), admin, json(Map.of("formaPagamento", "DINHEIRO")))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message").value("Abra o caixa antes de registrar saídas"));

            chamar(post("/api/caixas/abrir"), admin, json(Map.of("valorInicial", 100)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.saidas").value(0));
            chamar(post("/api/caixas/abrir"), admin, json(Map.of("valorInicial", 100)))
                    .andExpect(status().isConflict());
            chamar(post("/api/movimentacoes/" + id + "/saida"), admin, json(Map.of("formaPagamento", "DINHEIRO")))
                    .andExpect(status().isOk());
            chamar(get("/api/caixas/atual"), admin)
                    .andExpect(jsonPath("$.saidas").value(1))
                    .andExpect(jsonPath("$.fechadoPor").doesNotExist());
        }

        @Test
        void bloqueiaEntradaComEstacionamentoLotado() throws Exception {
            int noPatio = ler(chamar(get("/api/movimentacoes?situacao=PATIO"), admin), "$.total");
            String empresa = chamar(get("/api/empresa"), admin).andReturn().getResponse().getContentAsString();

            chamar(put("/api/empresa"), admin, empresa.replaceFirst("\"vagas\":\\d+", "\"vagas\":" + (noPatio - 1)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(containsString("veículos no pátio")));
            chamar(put("/api/empresa"), admin, empresa.replaceFirst("\"vagas\":\\d+", "\"vagas\":" + noPatio))
                    .andExpect(status().isOk());

            chamar(post("/api/movimentacoes/entrada"), admin, json(Map.of("placa", "LOT0A00", "modeloId", modeloCarro())))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message").value(containsString("lotado")));
        }

        @Test
        void paginaEFiltraPelaPlaca() throws Exception {
            chamar(get("/api/movimentacoes?situacao=TODAS&tamanho=5&pagina=1"), admin)
                    .andExpect(jsonPath("$.itens", hasSize(5)))
                    .andExpect(jsonPath("$.pagina").value(1));
            String placa = ler(chamar(get("/api/movimentacoes?situacao=PATIO"), admin), "$.itens[0].placa");
            chamar(get("/api/movimentacoes?situacao=PATIO&busca=" + placa.substring(0, 3).toLowerCase() + "-"
                            + placa.substring(3)), admin)
                    .andExpect(jsonPath("$.itens[0].placa").value(placa));
        }
    }

    @Nested
    class Cadastros {

        @Test
        void naoExcluiMarcaComModelos() throws Exception {
            List<Integer> comModelos = ler(chamar(get("/api/marcas"), admin), "$[?(@.modelos > 0)].id");
            Integer marca = comModelos.getFirst();
            chamar(delete("/api/marcas/" + marca), admin)
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message").value(containsString("exclua-os antes")));
        }

        @Test
        void criaRenomeiaEExcluiMarca() throws Exception {
            Integer id = ler(chamar(post("/api/marcas"), admin, json(Map.of("nome", "  BYD "))).andExpect(status().isCreated()), "$.id");
            chamar(post("/api/marcas"), admin, json(Map.of("nome", "byd"))).andExpect(status().isConflict());
            chamar(put("/api/marcas/" + id), admin, json(Map.of("nome", "BYD Auto")))
                    .andExpect(jsonPath("$.nome").value("BYD Auto"));
            chamar(delete("/api/marcas/" + id), admin).andExpect(status().isNoContent());
        }

        @Test
        void naoExcluiModeloComMovimentacoes() throws Exception {
            chamar(delete("/api/modelos/" + modeloCarro()), admin).andExpect(status().isConflict());
        }

        @Test
        void validaFaixasDePreco() throws Exception {
            chamar(put("/api/precos/MOTO"), admin, json(Map.of("ate15", 5, "ate30", 4, "ate45", 8, "ate60", 10,
                    "horaAdicional", 3)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(containsString("faixa anterior")));
            chamar(put("/api/precos/MOTO"), admin, json(Map.of("ate15", 5, "ate30", 7, "ate45", 9, "ate60", 11,
                    "horaAdicional", 3.5)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.horaAdicional").value(3.5));
        }
    }

    @Nested
    class Rh {

        Integer funcao() throws Exception {
            return ler(chamar(get("/api/funcoes"), admin), "$[0].id");
        }

        @Test
        void validaCpfEIdadeMinima() throws Exception {
            chamar(post("/api/funcionarios"), admin, json(Map.of("cpf", "123.456.789-00", "nome", "Fulano de Tal",
                    "nascimento", "1990-01-01", "admissao", "2020-01-01", "funcaoId", funcao())))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.campos.cpf").value("CPF inválido"));

            chamar(post("/api/funcionarios"), admin, json(Map.of("cpf", "529.982.247-25", "nome", "Fulano de Tal",
                    "nascimento", "2010-01-01", "admissao", "2025-01-01", "funcaoId", funcao())))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(containsString("16 anos")));
        }

        @Test
        void cadastraFuncionarioSemRepetirCpf() throws Exception {
            String body = json(Map.of("cpf", "529.982.247-25", "nome", "Fulano de Tal", "nascimento", "1990-05-10",
                    "admissao", "2020-03-01", "funcaoId", funcao()));
            chamar(post("/api/funcionarios"), admin, body)
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.cpf").value("52998224725"));
            chamar(post("/api/funcionarios"), admin, body).andExpect(status().isConflict());
        }

        @Test
        void naoExcluiFuncaoEmUso() throws Exception {
            List<Integer> emUsoIds = ler(chamar(get("/api/funcoes"), admin), "$[?(@.funcionarios > 0)].id");
            Integer emUso = emUsoIds.getFirst();
            chamar(delete("/api/funcoes/" + emUso), admin).andExpect(status().isConflict());
        }
    }

    @Nested
    class Relatorios {

        @Test
        void calculaReceitaLiquidaDescontandoTaxas() throws Exception {
            LocalDate hoje = LocalDate.now();
            ResultActions r = chamar(get("/api/relatorios/financeiro?de=" + hoje.minusDays(60) + "&ate=" + hoje), admin)
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.pagamentos").value(org.hamcrest.Matchers.greaterThan(1000)))
                    .andExpect(jsonPath("$.porDia", hasSize(61)))
                    .andExpect(jsonPath("$.porForma", hasSize(4)));
            double bruta = ler(r, "$.receitaBruta");
            double taxas = ler(r, "$.taxas");
            double liquida = ler(r, "$.receitaLiquida");
            org.assertj.core.api.Assertions.assertThat(liquida).isCloseTo(bruta - taxas,
                    org.assertj.core.api.Assertions.within(0.001));
        }

        @Test
        void recusaPeriodoInvertido() throws Exception {
            chamar(get("/api/relatorios/operacional?de=2026-02-01&ate=2026-01-01"), admin)
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("A data final não pode ser antes da inicial"));
        }

        @Test
        void montaDashboardComOcupacaoECaixa() throws Exception {
            chamar(get("/api/dashboard"), admin)
                    .andExpect(jsonPath("$.vagas").value(DemoData.VAGAS))
                    .andExpect(jsonPath("$.ocupadas").value(DemoData.VEICULOS_NO_PATIO))
                    .andExpect(jsonPath("$.entradasPorHoraHoje", hasSize(24)))
                    .andExpect(jsonPath("$.caixa.abertoPor").value("Carlos Lima"));
        }
    }
}
