export type StatusOcorrencia =
  | "AGUARDANDO_VALIDACAO"
  | "CONFIRMADA"
  | "REJEITADA"
  | "EM_ATENDIMENTO"
  | "RESOLVIDA";

export type ValidacaoHumana = "CONFIRMADA" | "REJEITADA";

export type EstadoTelemetria = "NORMAL" | "ATENÇÃO" | "SUSPEITO" | "CRÍTICO";

export type EstadoConversa =
  | "IDLE"
  | "AGUARDANDO_VALIDACAO"
  | "AGUARDANDO_CODIGO_CONSULTA";

export interface RegistroHistorico {
  dataHora: string;
  descricao: string;
  autor?: string;
}

export interface Ocorrencia {
  id: string;
  duto: string;
  trechoProvavel?: string;
  horario: string;
  sensores?: string[];
  criticidade?: "baixa" | "media" | "alta" | "critica";
  status: StatusOcorrencia;
  validacaoHumana?: ValidacaoHumana;
  estadoTelemetria: EstadoTelemetria;
  historico: RegistroHistorico[];
  operadorDesignado?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface AlertaPortMind {
  id?: string;
  duto: string;
  trechoProvavel?: string;
  horario?: string;
  sensores?: string[];
  criticidade?: "baixa" | "media" | "alta" | "critica";
  destinatario?: string;
}

export interface SessaoUsuario {
  usuario: string;
  estado: EstadoConversa;
  ocorrenciaPendenteId?: string;
  ultimaInteracao: string;
}

export interface RespostaProcessada {
  texto: string;
  statusOcorrencia?: StatusOcorrencia;
  validacaoHumana?: ValidacaoHumana;
  ocorrenciaId?: string;
}
