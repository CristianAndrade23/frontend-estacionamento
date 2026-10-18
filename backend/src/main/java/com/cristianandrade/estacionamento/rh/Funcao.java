package com.cristianandrade.estacionamento.rh;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;

@Entity
public class Funcao {

    @Id
    @GeneratedValue
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String nome;

    protected Funcao() {
    }

    public Funcao(String nome) {
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
