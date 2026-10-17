package com.cristianandrade.estacionamento.auth;

/**
 * ADMIN acessa tudo. OPERADOR cuida da rotina do pátio e do caixa, mas não vê RH, relatórios
 * financeiros, configurações nem altera preços.
 */
public enum Perfil {
    ADMIN,
    OPERADOR
}
