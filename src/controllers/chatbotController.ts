import { Request, Response } from "express";
import {
  gerarResposta,
  processarNovoAlerta
} from "../services/chatbotService";
import {
  obterOcorrencia,
  listarOcorrencias,
  atualizarTelemetriaDuto,
  atualizarStatusOcorrencia
} from "../services/ocorrenciaService";
import { EstadoTelemetria, StatusOcorrencia } from "../types";

interface MensagemBody {
  usuario: string;
  mensagem: string;
}

interface AlertaBody {
  id?: string;
  duto: string;
  trechoProvavel?: string;
  horario?: string;
  sensores?: string[];
  criticidade?: "baixa" | "media" | "alta" | "critica";
  destinatario: string;
}

interface TelemetriaBody {
  duto: string;
  estadoTelemetria: EstadoTelemetria;
  observacao?: string;
}

interface AtualizarStatusBody {
  status: StatusOcorrencia;
  observacao?: string;
  autor?: string;
}

/**
 * Endpoint para recebimento e processamento de mensagens dos operadores
 * POST /mensagem
 */
export function responderMensagem(
  req: Request<Record<string, never>, unknown, MensagemBody>,
  res: Response
): Response | void {
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

  const resultado = gerarResposta(usuario, mensagem);

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
export async function receberAlerta(
  req: Request<Record<string, never>, unknown, AlertaBody>,
  res: Response
): Promise<Response | void> {
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
    const resultado = await processarNovoAlerta({
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
  } catch (error) {
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
export function buscarOcorrenciaPorId(
  req: Request<{ id: string }>,
  res: Response
): Response | void {
  const { id } = req.params;
  const ocorrencia = obterOcorrencia(id);

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
export function listarTodasOcorrencias(_req: Request, res: Response): Response | void {
  const ocorrencias = listarOcorrencias();
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
export function atualizarTelemetria(
  req: Request<Record<string, never>, unknown, TelemetriaBody>,
  res: Response
): Response | void {
  const { duto, estadoTelemetria, observacao } = req.body;

  if (!duto || !estadoTelemetria) {
    return res.status(400).json({
      erro: "Campos 'duto' e 'estadoTelemetria' são obrigatórios."
    });
  }

  const ocorrenciasAfetadas = atualizarTelemetriaDuto(
    duto,
    estadoTelemetria,
    observacao
  );

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
export function alterarStatusOcorrencia(
  req: Request<{ id: string }, unknown, AtualizarStatusBody>,
  res: Response
): Response | void {
  const { id } = req.params;
  const { status, observacao, autor } = req.body;

  if (!status) {
    return res.status(400).json({
      erro: "Campo 'status' é obrigatório."
    });
  }

  const ocorrenciaAtualizada = atualizarStatusOcorrencia(
    id,
    status,
    observacao,
    autor
  );

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
