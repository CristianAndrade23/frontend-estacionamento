package com.cristianandrade.estacionamento.empresa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import java.math.BigDecimal;

/** Dados do estacionamento. Há um único registro, de id {@link #ID}. */
@Entity
public class Empresa {

    public static final long ID = 1L;

    @Id
    private Long id = ID;

    @Column(nullable = false)
    private String razaoSocial;

    @Column(nullable = false)
    private String nomeFantasia;

    @Column(nullable = false, length = 14)
    private String cnpj;

    @Column(nullable = false)
    private int vagas;

    @Column(nullable = false)
    private String endereco;

    @Column(nullable = false)
    private String cidade;

    @Column(nullable = false, length = 2)
    private String uf;

    /** Taxa da maquininha sobre pagamentos no débito, em %. */
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal taxaDebito;

    /** Taxa da maquininha sobre pagamentos no crédito, em %. */
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal taxaCredito;

    protected Empresa() {
    }

    public Empresa(String razaoSocial, String nomeFantasia, String cnpj, int vagas, String endereco, String cidade,
            String uf, BigDecimal taxaDebito, BigDecimal taxaCredito) {
        atualizar(razaoSocial, nomeFantasia, cnpj, vagas, endereco, cidade, uf, taxaDebito, taxaCredito);
    }

    public void atualizar(String razaoSocial, String nomeFantasia, String cnpj, int vagas, String endereco,
            String cidade, String uf, BigDecimal taxaDebito, BigDecimal taxaCredito) {
        this.razaoSocial = razaoSocial;
        this.nomeFantasia = nomeFantasia;
        this.cnpj = cnpj;
        this.vagas = vagas;
        this.endereco = endereco;
        this.cidade = cidade;
        this.uf = uf;
        this.taxaDebito = taxaDebito;
        this.taxaCredito = taxaCredito;
    }

    public String getRazaoSocial() {
        return razaoSocial;
    }

    public String getNomeFantasia() {
        return nomeFantasia;
    }

    public String getCnpj() {
        return cnpj;
    }

    public int getVagas() {
        return vagas;
    }

    public String getEndereco() {
        return endereco;
    }

    public String getCidade() {
        return cidade;
    }

    public String getUf() {
        return uf;
    }

    public BigDecimal getTaxaDebito() {
        return taxaDebito;
    }

    public BigDecimal getTaxaCredito() {
        return taxaCredito;
    }
}
