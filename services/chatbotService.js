const {
    definirEstado,
    obterEstado,
    limparEstado
} = require("./estadoService");

function gerarResposta(usuario, mensagem) {
    const estadoAtual = obterEstado(usuario);

    if (estadoAtual === "AGUARDANDO_CODIGO") {
        limparEstado(usuario);

        return `Consultando o incidente de código ${mensagem}.`;
    }

    if (mensagem.includes("incidente")) {
        definirEstado(usuario, "AGUARDANDO_CODIGO");

        return "Informe o código do incidente.";
    }

    return `
Olá! Sou o assistente do PortMind AI.

Digite "incidente" para consultar uma ocorrência.
`;
}

module.exports = {
    gerarResposta
};