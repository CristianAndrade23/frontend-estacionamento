package com.cristianandrade.estacionamento.rh;

import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface FuncionarioRepository extends JpaRepository<Funcionario, Long> {

    @EntityGraph(attributePaths = "funcao")
    List<Funcionario> findAllByOrderByNomeAsc();

    boolean existsByCpf(String cpf);

    boolean existsByCpfAndIdNot(String cpf, Long id);

    long countByFuncaoId(Long funcaoId);

    /** Quantidade de funcionários por função: [funcaoId, quantidade]. */
    @Query("select f.funcao.id, count(f) from Funcionario f group by f.funcao.id")
    List<Object[]> contarPorFuncao();
}
