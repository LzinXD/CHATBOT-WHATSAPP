import { Request, Response } from "express";
import { gerarResposta } from "../services/chatbotService";

interface MensagemBody {
  usuario?: string;
  mensagem: string;
}

export function responderMensagem(
  req: Request<Record<string, never>, unknown, MensagemBody>,
  res: Response
): Response | void {
  const { usuario = "teste", mensagem } = req.body;

  if (!mensagem || typeof mensagem !== "string") {
    return res.status(400).json({
      erro: "Envie uma mensagem válida do tipo string no campo 'mensagem'."
    });
  }

  console.log(`Mensagem recebida de [${usuario}]:`, mensagem);

  const resposta = gerarResposta(usuario, mensagem);

  return res.json({
    resposta
  });
}
