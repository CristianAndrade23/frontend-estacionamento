package com.cristianandrade.estacionamento.rh;

import com.cristianandrade.estacionamento.comum.ApiException;
import com.cristianandrade.estacionamento.comum.Documentos;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Cadastro de funções e funcionários. */
@Service
@Transactional
public class RhService {

    public static final int IDADE_MINIMA = 16;

    public record FuncaoDto(Long id, String nome, long funcionarios) {
    }

    public record FuncionarioDto(Long id, String cpf, String nome, LocalDate nascimento, LocalDate admissao,
            FuncaoRef funcao) {
        public record FuncaoRef(Long id, String nome) {
        }

        static FuncionarioDto de(Funcionario f) {
            return new FuncionarioDto(f.getId(), f.getCpf(), f.getNome(), f.getNascimento(), f.getAdmissao(),
                    new FuncaoRef(f.getFuncao().getId(), f.getFuncao().getNome()));
        }
    }

    public record DadosFuncionario(String cpf, String nome, LocalDate nascimento, LocalDate admissao, Long funcaoId) {
    }

    private final FuncaoRepository funcoes;
    private final FuncionarioRepository funcionarios;

    RhService(FuncaoRepository funcoes, FuncionarioRepository funcionarios) {
        this.funcoes = funcoes;
        this.funcionarios = funcionarios;
    }

    // --- Funções -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<FuncaoDto> listarFuncoes() {
        Map<Long, Long> quantidade = funcionarios.contarPorFuncao().stream()
                .collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));
        return funcoes.findAllByOrderByNomeAsc().stream()
                .map(f -> new FuncaoDto(f.getId(), f.getNome(), quantidade.getOrDefault(f.getId(), 0L)))
                .toList();
    }

    public FuncaoDto criarFuncao(String nome) {
        String limpo = nome.trim();
        if (funcoes.existsByNomeIgnoreCase(limpo)) throw ApiException.conflito("Já existe a função " + limpo);
        Funcao funcao = funcoes.save(new Funcao(limpo));
        return new FuncaoDto(funcao.getId(), funcao.getNome(), 0);
    }

    public FuncaoDto atualizarFuncao(Long id, String nome) {
        String limpo = nome.trim();
        Funcao funcao = funcao(id);
        if (funcoes.existsByNomeIgnoreCaseAndIdNot(limpo, id)) throw ApiException.conflito("Já existe a função " + limpo);
        funcao.setNome(limpo);
        return new FuncaoDto(funcao.getId(), funcao.getNome(), funcionarios.countByFuncaoId(id));
    }

    public void excluirFuncao(Long id) {
        Funcao funcao = funcao(id);
        long quantidade = funcionarios.countByFuncaoId(id);
        if (quantidade > 0) {
            throw ApiException.conflito("A função " + funcao.getNome() + " está atribuída a " + quantidade
                    + (quantidade == 1 ? " funcionário" : " funcionários"));
        }
        funcoes.delete(funcao);
    }

    private Funcao funcao(Long id) {
        return funcoes.findById(id).orElseThrow(() -> ApiException.naoEncontrado("Função não encontrada"));
    }

    // --- Funcionários --------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<FuncionarioDto> listarFuncionarios() {
        return funcionarios.findAllByOrderByNomeAsc().stream().map(FuncionarioDto::de).toList();
    }

    public FuncionarioDto criarFuncionario(DadosFuncionario dados) {
        String cpf = Documentos.somenteDigitos(dados.cpf());
        if (funcionarios.existsByCpf(cpf)) throw ApiException.conflito("Já existe um funcionário com este CPF");
        validarDatas(dados);
        Funcionario funcionario = new Funcionario(cpf, dados.nome().trim(), dados.nascimento(), dados.admissao(),
                funcaoDoFuncionario(dados.funcaoId()));
        return FuncionarioDto.de(funcionarios.save(funcionario));
    }

    public FuncionarioDto atualizarFuncionario(Long id, DadosFuncionario dados) {
        Funcionario funcionario = funcionarios.findById(id)
                .orElseThrow(() -> ApiException.naoEncontrado("Funcionário não encontrado"));
        String cpf = Documentos.somenteDigitos(dados.cpf());
        if (funcionarios.existsByCpfAndIdNot(cpf, id)) throw ApiException.conflito("Já existe um funcionário com este CPF");
        validarDatas(dados);
        funcionario.atualizar(cpf, dados.nome().trim(), dados.nascimento(), dados.admissao(),
                funcaoDoFuncionario(dados.funcaoId()));
        return FuncionarioDto.de(funcionario);
    }

    public void excluirFuncionario(Long id) {
        if (!funcionarios.existsById(id)) throw ApiException.naoEncontrado("Funcionário não encontrado");
        funcionarios.deleteById(id);
    }

    private static void validarDatas(DadosFuncionario dados) {
        if (dados.admissao().isBefore(dados.nascimento().plusYears(IDADE_MINIMA))) {
            throw ApiException.invalido("O funcionário precisa ter pelo menos " + IDADE_MINIMA + " anos na admissão");
        }
    }

    private Funcao funcaoDoFuncionario(Long funcaoId) {
        return funcoes.findById(funcaoId).orElseThrow(() -> ApiException.invalido("Função não encontrada"));
    }
}
