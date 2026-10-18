package com.cristianandrade.estacionamento.rh;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.LocalDate;

@Entity
public class Funcionario {

    @Id
    @GeneratedValue
    private Long id;

    /** Somente dígitos. */
    @Column(nullable = false, unique = true, length = 11)
    private String cpf;

    @Column(nullable = false, length = 80)
    private String nome;

    @Column(nullable = false)
    private LocalDate nascimento;

    @Column(nullable = false)
    private LocalDate admissao;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(nullable = false)
    private Funcao funcao;

    protected Funcionario() {
    }

    public Funcionario(String cpf, String nome, LocalDate nascimento, LocalDate admissao, Funcao funcao) {
        atualizar(cpf, nome, nascimento, admissao, funcao);
    }

    public void atualizar(String cpf, String nome, LocalDate nascimento, LocalDate admissao, Funcao funcao) {
        this.cpf = cpf;
        this.nome = nome;
        this.nascimento = nascimento;
        this.admissao = admissao;
        this.funcao = funcao;
    }

    public Long getId() {
        return id;
    }

    public String getCpf() {
        return cpf;
    }

    public String getNome() {
        return nome;
    }

    public LocalDate getNascimento() {
        return nascimento;
    }

    public LocalDate getAdmissao() {
        return admissao;
    }

    public Funcao getFuncao() {
        return funcao;
    }
}
