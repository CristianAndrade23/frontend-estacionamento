package com.cristianandrade.estacionamento.patio;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface MovimentacaoRepository extends JpaRepository<Movimentacao, Long> {

    boolean existsByPlacaAndSaidaIsNull(String placa);

    long countBySaidaIsNull();

    boolean existsByModeloId(Long modeloId);

    @EntityGraph(attributePaths = {"modelo", "modelo.marca"})
    Page<Movimentacao> findBySaidaIsNullAndPlacaContaining(String placa, Pageable pageable);

    @EntityGraph(attributePaths = {"modelo", "modelo.marca"})
    Page<Movimentacao> findByPlacaContaining(String placa, Pageable pageable);

    @EntityGraph(attributePaths = {"modelo", "modelo.marca"})
    List<Movimentacao> findBySaidaIsNull();

    @EntityGraph(attributePaths = {"modelo", "modelo.marca"})
    List<Movimentacao> findByEntradaGreaterThanEqualAndEntradaLessThan(LocalDateTime de, LocalDateTime ate);

    @EntityGraph(attributePaths = {"modelo"})
    List<Movimentacao> findBySaidaGreaterThanEqualAndSaidaLessThan(LocalDateTime de, LocalDateTime ate);

    @Query("""
            select m.caixa.id as caixaId, m.formaPagamento as forma, count(m) as quantidade, sum(m.valor) as valor
            from Movimentacao m
            where m.caixa.id in :ids
            group by m.caixa.id, m.formaPagamento
            """)
    List<TotalPorCaixa> totaisPorCaixa(Collection<Long> ids);

    interface TotalPorCaixa {
        Long getCaixaId();

        FormaPagamento getForma();

        long getQuantidade();

        BigDecimal getValor();
    }
}
