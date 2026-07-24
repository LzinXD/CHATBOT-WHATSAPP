const { gerarResposta } = require("../services/chatbotService");

function responderMensagem(req, res) {
    const mensagem = req.body.mensagem.toLowerCase();

    // Usuário temporário 
    const usuario = "teste";

    console.log("Mensagem recebida:", mensagem);

    const resposta = gerarResposta(usuario, mensagem);

    res.json({
        resposta
    });
}

module.exports = {
    responderMensagem
};
