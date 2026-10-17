package com.cristianandrade.estacionamento.veiculo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;

@Entity
public class Marca {

    @Id
    @GeneratedValue
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String nome;

    protected Marca() {
    }

    public Marca(String nome) {
        this.nome = nome;
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }
}
