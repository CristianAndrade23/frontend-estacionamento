package com.cristianandrade.estacionamento.preco;

import com.cristianandrade.estacionamento.veiculo.TipoVeiculo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TabelaPrecoRepository extends JpaRepository<TabelaPreco, TipoVeiculo> {
}
