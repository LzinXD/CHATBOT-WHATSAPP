"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processarNovoAlerta = processarNovoAlerta;
exports.gerarResposta = gerarResposta;
const estadoService_1 = require("./estadoService");
const ocorrenciaService_1 = require("./ocorrenciaService");
const whatsappService_1 = require("./whatsappService");
/**
 * Normaliza o texto de entrada do usuário para facilitar a comparação
 */
function normalizarTexto(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}
/**
 * Avalia se o texto corresponde a uma CONFIRMAÇÃO humana
 */
function isConfirmacao(textoNormalizado) {
    const opcoesValidas = [
        "1",
        "confirmar",
        "confirma",
        "confirmado",
        "confirmada",
        "sim",
        "s",
        "correto",
        "correta",
        "esta correto",
        "esta correta",
        "procede",
        "procedente",
        "positivo"
    ];
    return opcoesValidas.includes(textoNormalizado);
}
/**
 * Avalia se o texto corresponde a uma REJEIÇÃO humana (falso positivo)
 */
function isRejeicao(textoNormalizado) {
    const opcoesValidas = [
        "2",
        "rejeitar",
        "rejeito",
        "rejeitada",
        "rejeitado",
        "nao",
        "n",
        "falso",
        "falsa",
        "falso positivo",
        "incorreto",
        "incorreta",
        "improcedente"
    ];
    return opcoesValidas.includes(textoNormalizado);
}
/**
 * Formata os detalhes de uma ocorrência para visualização no chat
 */
function formatarDetalhesOcorrencia(ocorrencia) {
    const sensoresStr = ocorrencia.sensores && ocorrencia.sensores.length > 0
        ? ocorrencia.sensores.join(", ")
        : "Não especificados";
    return [
        `📋 DETALHES DA OCORRÊNCIA [${ocorrencia.id}]`,
        "",
        `Duto: ${ocorrencia.duto}`,
        `Trecho provável: ${ocorrencia.trechoProvavel || "A verificar"}`,
        `Horário do alerta: ${ocorrencia.horario}`,
        `Sensores envolvidos: ${sensoresStr}`,
        `Criticidade: ${ocorrencia.criticidade?.toUpperCase() || "ALTA"}`,
        `Status operacional: ${ocorrencia.status}`,
        `Validação humana: ${ocorrencia.validacaoHumana || "PENDENTE"}`,
        `Estado da telemetria: ${ocorrencia.estadoTelemetria}`
    ].join("\n");
}
/**
 * Dispara um novo alerta do PortMind AI para o operador via WhatsApp e coloca o operador em AGUARDANDO_VALIDACAO
 */
async function processarNovoAlerta(alerta) {
    const ocorrencia = (0, ocorrenciaService_1.criarOcorrenciaPorAlerta)(alerta);
    const destinatario = alerta.destinatario || "operador_padrao";
    // Define o estado do operador para aguardar a validação deste incidente específico
    (0, estadoService_1.definirEstado)(destinatario, "AGUARDANDO_VALIDACAO", ocorrencia.id);
    // Envia a mensagem ativa via camada de transporte WhatsApp
    await (0, whatsappService_1.enviarAlertaOcorrencia)(destinatario, ocorrencia);
    return {
        ocorrencia,
        destinatario
    };
}
/**
 * Processa a mensagem enviada pelo usuário/operador e retorna a resposta contextualizada
 */
function gerarResposta(usuario, mensagem) {
    const sessao = (0, estadoService_1.obterSessao)(usuario);
    const textoLimpo = normalizarTexto(mensagem);
    // 1. Tratamento quando aguardando validação de possível anomalia
    if (sessao.estado === "AGUARDANDO_VALIDACAO") {
        const ocorrenciaId = sessao.ocorrenciaPendenteId;
        if (isConfirmacao(textoLimpo)) {
            if (ocorrenciaId) {
                (0, ocorrenciaService_1.registrarValidacaoHumana)(ocorrenciaId, "CONFIRMADA", usuario);
            }
            (0, estadoService_1.limparEstado)(usuario);
            return {
                texto: "Ocorrência confirmada.\n\nA validação foi registrada no sistema.",
                statusOcorrencia: "CONFIRMADA",
                validacaoHumana: "CONFIRMADA",
                ocorrenciaId
            };
        }
        if (isRejeicao(textoLimpo)) {
            if (ocorrenciaId) {
                (0, ocorrenciaService_1.registrarValidacaoHumana)(ocorrenciaId, "REJEITADA", usuario);
            }
            (0, estadoService_1.limparEstado)(usuario);
            return {
                texto: "Ocorrência rejeitada.\n\nA rejeição foi registrada no sistema.",
                statusOcorrencia: "REJEITADA",
                validacaoHumana: "REJEITADA",
                ocorrenciaId
            };
        }
        // Resposta ambígua durante estado de validação
        return {
            texto: "Não consegui identificar sua resposta.\n\nResponda:\n1 - Confirmar\n2 - Rejeitar",
            ocorrenciaId
        };
    }
    // 2. Tratamento quando aguardando código de consulta de incidente
    if (sessao.estado === "AGUARDANDO_CODIGO_CONSULTA") {
        const codigoConsulta = mensagem.trim();
        const ocorrencia = (0, ocorrenciaService_1.obterOcorrencia)(codigoConsulta);
        (0, estadoService_1.limparEstado)(usuario);
        if (ocorrencia) {
            return {
                texto: formatarDetalhesOcorrencia(ocorrencia),
                ocorrenciaId: ocorrencia.id,
                statusOcorrencia: ocorrencia.status,
                validacaoHumana: ocorrencia.validacaoHumana
            };
        }
        else {
            return {
                texto: `Ocorrência com código "${codigoConsulta}" não foi encontrada no sistema PortMind AI.`
            };
        }
    }
    // 3. Tratamento de comandos em estado IDLE
    // Consulta de incidente secundária
    if (textoLimpo.includes("incidente") ||
        textoLimpo.includes("ocorrencia") ||
        textoLimpo.includes("consultar")) {
        (0, estadoService_1.definirEstado)(usuario, "AGUARDANDO_CODIGO_CONSULTA");
        return {
            texto: "Informe o código do incidente (ex: INC-1001)."
        };
    }
    // Saudações operacionais
    if (textoLimpo.includes("ola") ||
        textoLimpo.includes("oi") ||
        textoLimpo.includes("bom dia") ||
        textoLimpo.includes("boa tarde") ||
        textoLimpo.includes("boa noite") ||
        textoLimpo.includes("ajuda") ||
        textoLimpo.includes("menu")) {
        return {
            texto: [
                "Olá. Sou o assistente operacional do PortMind AI.",
                "",
                "Monitoro a rede de sensores de pressão e tubulações.",
                "Quando for detectada uma possível anomalia, você receberá um alerta automático para validação em campo.",
                "",
                "Opções disponíveis:",
                "• Digite \"incidente\" para consultar uma ocorrência existente."
            ].join("\n")
        };
    }
    // Fallback instruindo o operador
    return {
        texto: [
            "Comando não reconhecido.",
            "",
            "Sou o assistente operacional do PortMind AI.",
            "Quando houver uma possível anomalia nos sensores de pressão, um alerta será enviado automaticamente com as opções de confirmação.",
            "",
            "Para consultar uma ocorrência existente, envie \"incidente\"."
        ].join("\n")
    };
}
