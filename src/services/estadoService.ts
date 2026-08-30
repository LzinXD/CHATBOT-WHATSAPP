import { EstadoConversa, SessaoUsuario } from "../types";

// Repositório em memória para sessões (preparado para persistência futura / Redis / Supabase)
const sessoes: Map<string, SessaoUsuario> = new Map();

/**
 * Obtém a sessão atual de um usuário ou cria uma sessão inicial em IDLE
 */
export function obterSessao(usuario: string): SessaoUsuario {
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
export function obterEstado(usuario: string): EstadoConversa {
  return obterSessao(usuario).estado;
}

/**
 * Atualiza o estado da conversa do usuário e opcionalmente a ocorrência associada
 */
export function definirEstado(
  usuario: string,
  estado: EstadoConversa,
  ocorrenciaPendenteId?: string
): SessaoUsuario {
  const usuarioKey = usuario.trim();
  const sessaoAtual = obterSessao(usuarioKey);

  const novaSessao: SessaoUsuario = {
    ...sessaoAtual,
    estado,
    ocorrenciaPendenteId:
      ocorrenciaPendenteId !== undefined
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
export function limparEstado(usuario: string): void {
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
export function listarSessoes(): Record<string, SessaoUsuario> {
  const resultado: Record<string, SessaoUsuario> = {};
  sessoes.forEach((valor, chave) => {
    resultado[chave] = { ...valor };
  });
  return resultado;
}

/**
 * Reseta o repositório de sessões (útil para testes)
 */
export function resetarSessoes(): void {
  sessoes.clear();
}
