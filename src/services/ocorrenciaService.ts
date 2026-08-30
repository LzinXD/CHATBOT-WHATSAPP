import {
  Ocorrencia,
  AlertaPortMind,
  StatusOcorrencia,
  ValidacaoHumana,
  EstadoTelemetria
} from "../types";

// Repositório em memória para ocorrências (preparado para PostgreSQL / Supabase)
const ocorrencias: Map<string, Ocorrencia> = new Map();

// Contador sequencial para IDs quando não fornecidos
let contadorIncidente = 1000;

/**
 * Gera um ID único de ocorrência
 */
function gerarIdOcorrencia(): string {
  contadorIncidente += 1;
  return `INC-${contadorIncidente}`;
}

/**
 * Cria uma nova ocorrência a partir de um alerta emitido pelo PortMind AI
 */
export function criarOcorrenciaPorAlerta(alerta: AlertaPortMind): Ocorrencia {
  const agora = new Date().toISOString();
  const horarioFormatado =
    alerta.horario ||
    new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const id = alerta.id || gerarIdOcorrencia();

  const novaOcorrencia: Ocorrencia = {
    id,
    duto: alerta.duto,
    trechoProvavel: alerta.trechoProvavel,
    horario: horarioFormatado,
    sensores: alerta.sensores || [],
    criticidade: alerta.criticidade || "alta",
    status: "AGUARDANDO_VALIDACAO",
    validacaoHumana: undefined,
    estadoTelemetria: "SUSPEITO",
    operadorDesignado: alerta.destinatario,
    historico: [
      {
        dataHora: agora,
        descricao: `Alerta gerado pelo PortMind AI. Possível anomalia detectada no duto ${alerta.duto}, trecho provável ${alerta.trechoProvavel || "N/A"}.`,
        autor: "PortMind AI"
      }
    ],
    criadoEm: agora,
    atualizadoEm: agora
  };

  ocorrencias.set(id, novaOcorrencia);
  return { ...novaOcorrencia };
}

/**
 * Busca uma ocorrência pelo ID
 */
export function obterOcorrencia(id: string): Ocorrencia | undefined {
  const ocorrencia = ocorrencias.get(id.toUpperCase().trim());
  return ocorrencia ? { ...ocorrencia } : undefined;
}

/**
 * Lista todas as ocorrências cadastradas
 */
export function listarOcorrencias(): Ocorrencia[] {
  return Array.from(ocorrencias.values()).map((oc) => ({ ...oc }));
}

/**
 * Registra a validação humana de uma ocorrência (CONFIRMAR ou REJEITAR)
 */
export function registrarValidacaoHumana(
  id: string,
  validacao: ValidacaoHumana,
  operador: string
): Ocorrencia | null {
  const ocorrencia = ocorrencias.get(id.toUpperCase().trim());
  if (!ocorrencia) return null;

  const agora = new Date().toISOString();
  const novoStatus: StatusOcorrencia =
    validacao === "CONFIRMADA" ? "CONFIRMADA" : "REJEITADA";

  ocorrencia.validacaoHumana = validacao;
  ocorrencia.status = novoStatus;
  ocorrencia.operadorDesignado = operador;
  ocorrencia.atualizadoEm = agora;

  ocorrencia.historico.push({
    dataHora: agora,
    descricao:
      validacao === "CONFIRMADA"
        ? `Ocorrência confirmada pelo operador [${operador}].`
        : `Ocorrência rejeitada pelo operador [${operador}] (falso positivo).`,
    autor: operador
  });

  return { ...ocorrencia };
}

/**
 * Atualiza o status operacional de uma ocorrência (ex: EM_ATENDIMENTO, RESOLVIDA)
 */
export function atualizarStatusOcorrencia(
  id: string,
  novoStatus: StatusOcorrencia,
  observacao?: string,
  autor: string = "Sistema"
): Ocorrencia | null {
  const ocorrencia = ocorrencias.get(id.toUpperCase().trim());
  if (!ocorrencia) return null;

  const agora = new Date().toISOString();
  ocorrencia.status = novoStatus;
  ocorrencia.atualizadoEm = agora;

  ocorrencia.historico.push({
    dataHora: agora,
    descricao: `Status operacional alterado para ${novoStatus}.${observacao ? ` Detalhes: ${observacao}` : ""}`,
    autor
  });

  return { ...ocorrencia };
}

/**
 * Atualiza o estado da telemetria de um duto (ex: NORMAL, SUSPEITO, CRÍTICO)
 * Regra: Normalização da telemetria NÃO fecha automaticamente ocorrências confirmadas/em atendimento.
 */
export function atualizarTelemetriaDuto(
  duto: string,
  novoEstadoTelemetria: EstadoTelemetria,
  observacao?: string
): Ocorrencia[] {
  const agora = new Date().toISOString();
  const ocorrenciasAfetadas: Ocorrencia[] = [];

  ocorrencias.forEach((ocorrencia) => {
    if (ocorrencia.duto.toUpperCase() === duto.toUpperCase()) {
      ocorrencia.estadoTelemetria = novoEstadoTelemetria;
      ocorrencia.atualizadoEm = agora;

      ocorrencia.historico.push({
        dataHora: agora,
        descricao: `Telemetria do duto ${duto} atualizada para ${novoEstadoTelemetria}.${observacao ? ` Observação: ${observacao}` : ""}`,
        autor: "PortMind AI Telemetria"
      });

      ocorrenciasAfetadas.push({ ...ocorrencia });
    }
  });

  return ocorrenciasAfetadas;
}

/**
 * Reseta o repositório de ocorrências (útil para testes)
 */
export function resetarOcorrencias(): void {
  ocorrencias.clear();
  contadorIncidente = 1000;
}
