package com.cristianandrade.estacionamento.config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
class ClockConfig {

    /** Relógio no fuso do estacionamento. Injetado em vez de `LocalDateTime.now()` para facilitar testes. */
    @Bean
    Clock clock(AppProperties props) {
        return Clock.system(props.fuso());
    }
}
