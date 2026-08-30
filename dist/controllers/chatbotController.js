"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responderMensagem = responderMensagem;
exports.receberAlerta = receberAlerta;
exports.buscarOcorrenciaPorId = buscarOcorrenciaPorId;
exports.listarTodasOcorrencias = listarTodasOcorrencias;
exports.atualizarTelemetria = atualizarTelemetria;
exports.alterarStatusOcorrencia = alterarStatusOcorrencia;
const chatbotService_1 = require("../services/chatbotService");
const ocorrenciaService_1 = require("../services/ocorrenciaService");
/**
 * Endpoint para recebimento e processamento de mensagens dos operadores
 * POST /mensagem
 */
function responderMensagem(req, res) {
    const { usuario, mensagem } = req.body;
    if (!usuario || typeof usuario !== "string" || usuario.trim() === "") {
        return res.status(400).json({
            erro: "Envie um identificador válido no campo 'usuario' (ex: telefone ou ID do operador)."
        });
    }
    if (!mensagem || typeof mensagem !== "string" || mensagem.trim() === "") {
        return res.status(400).json({
            erro: "Envie uma mensagem válida do tipo string no campo 'mensagem'."
        });
    }
    console.log(`[Mensagem Recebida] Operador: ${usuario} | Texto: "${mensagem}"`);
    const resultado = (0, chatbotService_1.gerarResposta)(usuario, mensagem);
    return res.json({
        sucesso: true,
        usuario,
        resposta: resultado.texto,
        ocorrenciaId: resultado.ocorrenciaId,
        statusOcorrencia: resultado.statusOcorrencia,
        validacaoHumana: resultado.validacaoHumana
    });
}
/**
 * Endpoint para o PortMind AI enviar alertas de possíveis anomalias
 * POST /alerta
 */
async function receberAlerta(req, res) {
    const { duto, destinatario, trechoProvavel, horario, sensores, criticidade, id } = req.body;
    if (!duto || typeof duto !== "string") {
        return res.status(400).json({
            erro: "Campo 'duto' é obrigatório (ex: 'D02')."
        });
    }
    if (!destinatario || typeof destinatario !== "string") {
        return res.status(400).json({
            erro: "Campo 'destinatario' é obrigatório (ex: telefone ou ID do operador responsável)."
        });
    }
    try {
        const resultado = await (0, chatbotService_1.processarNovoAlerta)({
            id,
            duto,
            trechoProvavel,
            horario,
            sensores,
            criticidade,
            destinatario
        });
        return res.status(201).json({
            sucesso: true,
            mensagem: "Alerta emitido e enviado ao operador com sucesso.",
            ocorrencia: resultado.ocorrencia
        });
    }
    catch (error) {
        console.error("Erro ao emitir alerta:", error);
        return res.status(500).json({
            erro: "Falha ao processar e emitir alerta do PortMind AI."
        });
    }
}
/**
 * Endpoint para consulta de detalhes de uma ocorrência
 * GET /ocorrencias/:id
 */
function buscarOcorrenciaPorId(req, res) {
    const { id } = req.params;
    const ocorrencia = (0, ocorrenciaService_1.obterOcorrencia)(id);
    if (!ocorrencia) {
        return res.status(404).json({
            erro: `Ocorrência com ID '${id}' não encontrada.`
        });
    }
    return res.json({
        sucesso: true,
        ocorrencia
    });
}
/**
 * Endpoint para listagem de todas as ocorrências
 * GET /ocorrencias
 */
function listarTodasOcorrencias(_req, res) {
    const ocorrencias = (0, ocorrenciaService_1.listarOcorrencias)();
    return res.json({
        sucesso: true,
        total: ocorrencias.length,
        ocorrencias
    });
}
/**
 * Endpoint para atualização de telemetria (ex: normalização de sensores)
 * POST /telemetria/normalizacao
 */
function atualizarTelemetria(req, res) {
    const { duto, estadoTelemetria, observacao } = req.body;
    if (!duto || !estadoTelemetria) {
        return res.status(400).json({
            erro: "Campos 'duto' e 'estadoTelemetria' são obrigatórios."
        });
    }
    const ocorrenciasAfetadas = (0, ocorrenciaService_1.atualizarTelemetriaDuto)(duto, estadoTelemetria, observacao);
    return res.json({
        sucesso: true,
        mensagem: `Telemetria do duto ${duto} atualizada para ${estadoTelemetria}.`,
        ocorrenciasAfetadas
    });
}
/**
 * Endpoint para atualização de status operacional de uma ocorrência
 * PATCH /ocorrencias/:id/status
 */
function alterarStatusOcorrencia(req, res) {
    const { id } = req.params;
    const { status, observacao, autor } = req.body;
    if (!status) {
        return res.status(400).json({
            erro: "Campo 'status' é obrigatório."
        });
    }
    const ocorrenciaAtualizada = (0, ocorrenciaService_1.atualizarStatusOcorrencia)(id, status, observacao, autor);
    if (!ocorrenciaAtualizada) {
        return res.status(404).json({
            erro: `Ocorrência '${id}' não encontrada.`
        });
    }
    return res.json({
        sucesso: true,
        ocorrencia: ocorrenciaAtualizada
    });
}
