package com.cristianandrade.estacionamento.veiculo;

import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ModeloRepository extends JpaRepository<Modelo, Long> {

    @EntityGraph(attributePaths = "marca")
    List<Modelo> findAllByOrderByMarcaNomeAscNomeAsc();

    long countByMarcaId(Long marcaId);

    boolean existsByMarcaIdAndNomeIgnoreCase(Long marcaId, String nome);

    boolean existsByMarcaIdAndNomeIgnoreCaseAndIdNot(Long marcaId, String nome, Long id);

    /** Quantidade de modelos por marca, para a listagem de marcas: [marcaId, quantidade]. */
    @Query("select m.marca.id, count(m) from Modelo m group by m.marca.id")
    List<Object[]> contarPorMarca();
}
