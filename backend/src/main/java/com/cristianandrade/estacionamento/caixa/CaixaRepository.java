package com.cristianandrade.estacionamento.caixa;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CaixaRepository extends JpaRepository<Caixa, Long> {

    Optional<Caixa> findFirstByFechamentoIsNull();

    List<Caixa> findByAberturaGreaterThanEqualAndAberturaLessThanOrderByAberturaDesc(LocalDateTime de,
            LocalDateTime ate);
}
