package com.cristianandrade.estacionamento.config;

import java.time.Duration;
import java.time.ZoneId;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configurações da aplicação (prefixo `app` no application.properties).
 *
 * @param jwtSecret  segredo HMAC do token (mínimo de 32 bytes); em produção venha de variável de ambiente
 * @param jwtExpiracao validade do token
 * @param fuso       fuso horário do estacionamento, usado para "hoje", caixas e relatórios
 * @param demoReset  habilita POST /api/demo/reset (restaura os dados de demonstração)
 */
@ConfigurationProperties("app")
public record AppProperties(String jwtSecret, Duration jwtExpiracao, ZoneId fuso, boolean demoReset) {
}
