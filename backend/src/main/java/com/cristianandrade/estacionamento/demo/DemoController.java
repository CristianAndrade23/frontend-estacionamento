package com.cristianandrade.estacionamento.demo;

import com.cristianandrade.estacionamento.comum.ApiException;
import com.cristianandrade.estacionamento.config.AppProperties;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/demo")
public class DemoController {

    private final DemoData demoData;
    private final AppProperties props;

    DemoController(DemoData demoData, AppProperties props) {
        this.demoData = demoData;
        this.props = props;
    }

    /** Volta todos os dados ao estado inicial da demonstração (usado pelo menu do painel e pelos testes E2E). */
    @PostMapping("/reset")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reset() {
        if (!props.demoReset()) throw ApiException.naoEncontrado("Recurso não encontrado");
        demoData.restaurar();
    }

    /** Carrega a demonstração quando a aplicação sobe (o banco H2 é em memória). */
    @Bean
    static ApplicationRunner carregarDemo(DemoData demoData) {
        return (ApplicationArguments args) -> demoData.restaurar();
    }
}
