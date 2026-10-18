package com.cristianandrade.estacionamento.empresa;

import com.cristianandrade.estacionamento.comum.ApiException;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmpresaRepository extends JpaRepository<Empresa, Long> {

    default Empresa obter() {
        return findById(Empresa.ID).orElseThrow(() -> ApiException.naoEncontrado("Empresa não configurada"));
    }
}
