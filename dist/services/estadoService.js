"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.obterSessao = obterSessao;
exports.obterEstado = obterEstado;
exports.definirEstado = definirEstado;
exports.limparEstado = limparEstado;
exports.listarSessoes = listarSessoes;
exports.resetarSessoes = resetarSessoes;
// Repositório em memória para sessões (preparado para persistência futura / Redis / Supabase)
const sessoes = new Map();
/**
 * Obtém a sessão atual de um usuário ou cria uma sessão inicial em IDLE
 */
function obterSessao(usuario) {
    const usuarioKey = usuario.trim();
    let sessao = sessoes.get(usuarioKey);
    if (!sessao) {
        sessao = {
            usuario: usuarioKey,
            estado: "IDLE",
            ultimaInteracao: new Date().toISOString()
        };
        sessoes.set(usuarioKey, sessao);
    }
    return { ...sessao };
}
/**
 * Obtém apenas o estado da conversa do usuário
 */
function obterEstado(usuario) {
    return obterSessao(usuario).estado;
}
/**
 * Atualiza o estado da conversa do usuário e opcionalmente a ocorrência associada
 */
function definirEstado(usuario, estado, ocorrenciaPendenteId) {
    const usuarioKey = usuario.trim();
    const sessaoAtual = obterSessao(usuarioKey);
    const novaSessao = {
        ...sessaoAtual,
        estado,
        ocorrenciaPendenteId: ocorrenciaPendenteId !== undefined
            ? ocorrenciaPendenteId
            : sessaoAtual.ocorrenciaPendenteId,
        ultimaInteracao: new Date().toISOString()
    };
    sessoes.set(usuarioKey, novaSessao);
    return { ...novaSessao };
}
/**
 * Retorna o usuário ao estado inicial IDLE e limpa referências pendentes
 */
function limparEstado(usuario) {
    const usuarioKey = usuario.trim();
    if (sessoes.has(usuarioKey)) {
        sessoes.set(usuarioKey, {
            usuario: usuarioKey,
            estado: "IDLE",
            ocorrenciaPendenteId: undefined,
            ultimaInteracao: new Date().toISOString()
        });
    }
}
/**
 * Retorna todas as sessões ativas (útil para auditoria/monitoramento)
 */
function listarSessoes() {
    const resultado = {};
    sessoes.forEach((valor, chave) => {
        resultado[chave] = { ...valor };
    });
    return resultado;
}
/**
 * Reseta o repositório de sessões (útil para testes)
 */
function resetarSessoes() {
    sessoes.clear();
}
