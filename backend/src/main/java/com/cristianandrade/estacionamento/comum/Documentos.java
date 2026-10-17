package com.cristianandrade.estacionamento.comum;

import java.util.regex.Pattern;

/** Validação e normalização de placa, CPF e CNPJ. */
public final class Documentos {

    /** Placa no padrão antigo (ABC1234) ou Mercosul (ABC1D23), já sem hífen. */
    private static final Pattern PLACA = Pattern.compile("^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$");

    private Documentos() {
    }

    public static String somenteDigitos(String valor) {
        return valor == null ? "" : valor.replaceAll("\\D", "");
    }

    /** Remove hífen e espaços e passa para maiúsculas. */
    public static String normalizarPlaca(String placa) {
        return placa == null ? "" : placa.replaceAll("[\\s-]", "").toUpperCase();
    }

    public static boolean placaValida(String placa) {
        return PLACA.matcher(normalizarPlaca(placa)).matches();
    }

    public static boolean cpfValido(String cpf) {
        String d = somenteDigitos(cpf);
        if (d.length() != 11 || d.chars().distinct().count() == 1) return false;
        return digito(d, 9, 10) == d.charAt(9) - '0' && digito(d, 10, 11) == d.charAt(10) - '0';
    }

    public static boolean cnpjValido(String cnpj) {
        String d = somenteDigitos(cnpj);
        if (d.length() != 14 || d.chars().distinct().count() == 1) return false;
        int[] pesos1 = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int[] pesos2 = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        return digitoCnpj(d, pesos1) == d.charAt(12) - '0' && digitoCnpj(d, pesos2) == d.charAt(13) - '0';
    }

    /** Completa 9 dígitos com os verificadores, formando um CPF válido. */
    public static String completarCpf(String noveDigitos) {
        String parcial = noveDigitos + digito(noveDigitos, 9, 10);
        return parcial + digito(parcial, 10, 11);
    }

    /** Completa 12 dígitos com os verificadores, formando um CNPJ válido. */
    public static String completarCnpj(String dozeDigitos) {
        String parcial = dozeDigitos + digitoCnpj(dozeDigitos, new int[] {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2});
        return parcial + digitoCnpj(parcial, new int[] {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2});
    }

    /** Dígito verificador do CPF: soma dos `quantidade` primeiros dígitos com pesos decrescentes a partir de `pesoInicial`. */
    private static int digito(String d, int quantidade, int pesoInicial) {
        int soma = 0;
        for (int i = 0; i < quantidade; i++) soma += (d.charAt(i) - '0') * (pesoInicial - i);
        int resto = (soma * 10) % 11;
        return resto == 10 ? 0 : resto;
    }

    private static int digitoCnpj(String d, int[] pesos) {
        int soma = 0;
        for (int i = 0; i < pesos.length; i++) soma += (d.charAt(i) - '0') * pesos[i];
        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }
}
