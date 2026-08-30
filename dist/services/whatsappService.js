"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enviarMensagem = enviarMensagem;
exports.enviarAlertaOcorrencia = enviarAlertaOcorrencia;
exports.listarMensagensEnviadas = listarMensagensEnviadas;
exports.limparHistoricoEnvios = limparHistoricoEnvios;
// Histórico de mensagens enviadas (para auditoria/testes)
const mensagensEnviadas = [];
/**
 * Abstração para envio de mensagem via WhatsApp
 * Desacoplado para facilitar integração direta com a WhatsApp Business API
 */
async function enviarMensagem(destinatario, mensagem) {
    const agora = new Date().toISOString();
    const idMensagem = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const resultado = {
        sucesso: true,
        idMensagem,
        destinatario,
        conteudo: mensagem,
        enviadoEm: agora
    };
    mensagensEnviadas.push(resultado);
    console.log(`\n📱 [WhatsApp] Enviando para [${destinatario}]:\n${mensagem}\n`);
    return resultado;
}
/**
 * Formata e envia a notificação de alerta de possível anomalia para o operador
 */
async function enviarAlertaOcorrencia(destinatario, ocorrencia) {
    const sensoresStr = ocorrencia.sensores && ocorrencia.sensores.length > 0
        ? ocorrencia.sensores.join(", ")
        : "Sensores de pressão do duto";
    const mensagemAlerta = [
        "🚨 PORTMIND AI — POSSÍVEL ANOMALIA",
        "",
        "Foi identificada uma possível anomalia na tubulação.",
        "",
        `Código: ${ocorrencia.id}`,
        `Duto: ${ocorrencia.duto}`,
        `Trecho provável: ${ocorrencia.trechoProvavel || "A verificar"}`,
        `Horário: ${ocorrencia.horario}`,
        `Sensores envolvidos: ${sensoresStr}`,
        "",
        "Verifique a situação no local.",
        "",
        "A detecção estava correta?",
        "",
        "1 - Confirmar",
        "2 - Rejeitar"
    ].join("\n");
    return enviarMensagem(destinatario, mensagemAlerta);
}
/**
 * Retorna as mensagens enviadas (útil para asserção em testes e monitoramento)
 */
function listarMensagensEnviadas() {
    return [...mensagensEnviadas];
}
/**
 * Limpa o histórico de mensagens enviadas
 */
function limparHistoricoEnvios() {
    mensagensEnviadas.length = 0;
}
