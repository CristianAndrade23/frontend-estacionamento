package com.cristianandrade.estacionamento.comum;

import java.util.List;
import java.util.function.Function;
import org.springframework.data.domain.Page;

/** Página de resultados com contrato estável (sem expor a serialização interna do Spring Data). */
public record Pagina<T>(List<T> itens, long total, int pagina, int tamanho) {

    public static <E, T> Pagina<T> de(Page<E> page, Function<E, T> mapper) {
        return new Pagina<>(page.getContent().stream().map(mapper).toList(), page.getTotalElements(),
                page.getNumber(), page.getSize());
    }
}
