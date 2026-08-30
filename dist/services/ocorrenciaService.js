"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.criarOcorrenciaPorAlerta = criarOcorrenciaPorAlerta;
exports.obterOcorrencia = obterOcorrencia;
exports.listarOcorrencias = listarOcorrencias;
exports.registrarValidacaoHumana = registrarValidacaoHumana;
exports.atualizarStatusOcorrencia = atualizarStatusOcorrencia;
exports.atualizarTelemetriaDuto = atualizarTelemetriaDuto;
exports.resetarOcorrencias = resetarOcorrencias;
// Repositório em memória para ocorrências (preparado para PostgreSQL / Supabase)
const ocorrencias = new Map();
// Contador sequencial para IDs quando não fornecidos
let contadorIncidente = 1000;
/**
 * Gera um ID único de ocorrência
 */
function gerarIdOcorrencia() {
    contadorIncidente += 1;
    return `INC-${contadorIncidente}`;
}
/**
 * Cria uma nova ocorrência a partir de um alerta emitido pelo PortMind AI
 */
function criarOcorrenciaPorAlerta(alerta) {
    const agora = new Date().toISOString();
    const horarioFormatado = alerta.horario ||
        new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const id = alerta.id || gerarIdOcorrencia();
    const novaOcorrencia = {
        id,
        duto: alerta.duto,
        trechoProvavel: alerta.trechoProvavel,
        horario: horarioFormatado,
        sensores: alerta.sensores || [],
        criticidade: alerta.criticidade || "alta",
        status: "AGUARDANDO_VALIDACAO",
        validacaoHumana: undefined,
        estadoTelemetria: "SUSPEITO",
        operadorDesignado: alerta.destinatario,
        historico: [
            {
                dataHora: agora,
                descricao: `Alerta gerado pelo PortMind AI. Possível anomalia detectada no duto ${alerta.duto}, trecho provável ${alerta.trechoProvavel || "N/A"}.`,
                autor: "PortMind AI"
            }
        ],
        criadoEm: agora,
        atualizadoEm: agora
    };
    ocorrencias.set(id, novaOcorrencia);
    return { ...novaOcorrencia };
}
/**
 * Busca uma ocorrência pelo ID
 */
function obterOcorrencia(id) {
    const ocorrencia = ocorrencias.get(id.toUpperCase().trim());
    return ocorrencia ? { ...ocorrencia } : undefined;
}
/**
 * Lista todas as ocorrências cadastradas
 */
function listarOcorrencias() {
    return Array.from(ocorrencias.values()).map((oc) => ({ ...oc }));
}
/**
 * Registra a validação humana de uma ocorrência (CONFIRMAR ou REJEITAR)
 */
function registrarValidacaoHumana(id, validacao, operador) {
    const ocorrencia = ocorrencias.get(id.toUpperCase().trim());
    if (!ocorrencia)
        return null;
    const agora = new Date().toISOString();
    const novoStatus = validacao === "CONFIRMADA" ? "CONFIRMADA" : "REJEITADA";
    ocorrencia.validacaoHumana = validacao;
    ocorrencia.status = novoStatus;
    ocorrencia.operadorDesignado = operador;
    ocorrencia.atualizadoEm = agora;
    ocorrencia.historico.push({
        dataHora: agora,
        descricao: validacao === "CONFIRMADA"
            ? `Ocorrência confirmada pelo operador [${operador}].`
            : `Ocorrência rejeitada pelo operador [${operador}] (falso positivo).`,
        autor: operador
    });
    return { ...ocorrencia };
}
/**
 * Atualiza o status operacional de uma ocorrência (ex: EM_ATENDIMENTO, RESOLVIDA)
 */
function atualizarStatusOcorrencia(id, novoStatus, observacao, autor = "Sistema") {
    const ocorrencia = ocorrencias.get(id.toUpperCase().trim());
    if (!ocorrencia)
        return null;
    const agora = new Date().toISOString();
    ocorrencia.status = novoStatus;
    ocorrencia.atualizadoEm = agora;
    ocorrencia.historico.push({
        dataHora: agora,
        descricao: `Status operacional alterado para ${novoStatus}.${observacao ? ` Detalhes: ${observacao}` : ""}`,
        autor
    });
    return { ...ocorrencia };
}
/**
 * Atualiza o estado da telemetria de um duto (ex: NORMAL, SUSPEITO, CRÍTICO)
 * Regra: Normalização da telemetria NÃO fecha automaticamente ocorrências confirmadas/em atendimento.
 */
function atualizarTelemetriaDuto(duto, novoEstadoTelemetria, observacao) {
    const agora = new Date().toISOString();
    const ocorrenciasAfetadas = [];
    ocorrencias.forEach((ocorrencia) => {
        if (ocorrencia.duto.toUpperCase() === duto.toUpperCase()) {
            ocorrencia.estadoTelemetria = novoEstadoTelemetria;
            ocorrencia.atualizadoEm = agora;
            ocorrencia.historico.push({
                dataHora: agora,
                descricao: `Telemetria do duto ${duto} atualizada para ${novoEstadoTelemetria}.${observacao ? ` Observação: ${observacao}` : ""}`,
                autor: "PortMind AI Telemetria"
            });
            ocorrenciasAfetadas.push({ ...ocorrencia });
        }
    });
    return ocorrenciasAfetadas;
}
/**
 * Reseta o repositório de ocorrências (útil para testes)
 */
function resetarOcorrencias() {
    ocorrencias.clear();
    contadorIncidente = 1000;
}
