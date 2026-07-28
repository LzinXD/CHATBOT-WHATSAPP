import { definirEstado, obterEstado, limparEstado } from "./estadoService";

export function gerarResposta(usuario: string, mensagem: string): string {
  const texto = mensagem.toLowerCase().trim();
  const estadoAtual = obterEstado(usuario);

  if (estadoAtual === "AGUARDANDO_CODIGO") {
    limparEstado(usuario);
    return `Consultando o incidente de código ${mensagem}.`;
  }

  if (
    texto.includes("olá") ||
    texto.includes("ola") ||
    texto.includes("oi")
  ) {
    return "Olá! Sou o assistente do PortMind AI. Digite \"incidente\" para consultar uma ocorrência.";
  }

  if (texto.includes("incidente")) {
    definirEstado(usuario, "AGUARDANDO_CODIGO");
    return "Informe o código do incidente.";
  }

  return "Não entendi sua mensagem. Digite \"incidente\" para consultar uma ocorrência.";
}
