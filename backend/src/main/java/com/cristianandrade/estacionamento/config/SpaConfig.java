package com.cristianandrade.estacionamento.config;

import java.io.IOException;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

/**
 * Entrega o build do Angular (empacotado em `static/` pelo perfil Maven `frontend`).
 * Rotas do painel que não são arquivos (ex.: /painel/caixa) recebem o index.html, e o
 * roteador do Angular assume dali. Caminhos da API nunca caem aqui.
 */
@Configuration
class SpaConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String path, Resource location) throws IOException {
                        if (!path.isEmpty()) {
                            Resource arquivo = location.createRelative(path);
                            if (arquivo.exists() && arquivo.isReadable()) return arquivo;
                        }
                        if (path.startsWith("api/") || path.startsWith("actuator/") || path.contains(".")) {
                            return null;
                        }
                        Resource index = location.createRelative("index.html");
                        return index.exists() ? index : null;
                    }
                });
    }
}
