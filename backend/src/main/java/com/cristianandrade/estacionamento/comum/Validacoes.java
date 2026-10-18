package com.cristianandrade.estacionamento.comum;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** Bean Validation para documentos brasileiros e placas. Valores nulos ficam a cargo de `@NotBlank`. */
public final class Validacoes {

    private Validacoes() {
    }

    @Documented
    @Constraint(validatedBy = CpfValidator.class)
    @Target({ElementType.FIELD, ElementType.RECORD_COMPONENT, ElementType.PARAMETER})
    @Retention(RetentionPolicy.RUNTIME)
    public @interface Cpf {
        String message() default "CPF inválido";

        Class<?>[] groups() default {};

        Class<? extends Payload>[] payload() default {};
    }

    @Documented
    @Constraint(validatedBy = CnpjValidator.class)
    @Target({ElementType.FIELD, ElementType.RECORD_COMPONENT, ElementType.PARAMETER})
    @Retention(RetentionPolicy.RUNTIME)
    public @interface Cnpj {
        String message() default "CNPJ inválido";

        Class<?>[] groups() default {};

        Class<? extends Payload>[] payload() default {};
    }

    @Documented
    @Constraint(validatedBy = PlacaValidator.class)
    @Target({ElementType.FIELD, ElementType.RECORD_COMPONENT, ElementType.PARAMETER})
    @Retention(RetentionPolicy.RUNTIME)
    public @interface Placa {
        String message() default "Placa inválida (use ABC-1234 ou ABC1D23)";

        Class<?>[] groups() default {};

        Class<? extends Payload>[] payload() default {};
    }

    public static class CpfValidator implements ConstraintValidator<Cpf, String> {
        @Override
        public boolean isValid(String value, ConstraintValidatorContext context) {
            return value == null || value.isBlank() || Documentos.cpfValido(value);
        }
    }

    public static class CnpjValidator implements ConstraintValidator<Cnpj, String> {
        @Override
        public boolean isValid(String value, ConstraintValidatorContext context) {
            return value == null || value.isBlank() || Documentos.cnpjValido(value);
        }
    }

    public static class PlacaValidator implements ConstraintValidator<Placa, String> {
        @Override
        public boolean isValid(String value, ConstraintValidatorContext context) {
            return value == null || value.isBlank() || Documentos.placaValida(value);
        }
    }
}
