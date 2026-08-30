import {
  gerarResposta,
  processarNovoAlerta
} from "../services/chatbotService";
import {
  obterSessao,
  obterEstado,
  resetarSessoes
} from "../services/estadoService";
import {
  obterOcorrencia,
  listarOcorrencias,
  atualizarTelemetriaDuto,
  atualizarStatusOcorrencia,
  resetarOcorrencias
} from "../services/ocorrenciaService";
import {
  listarMensagensEnviadas,
  limparHistoricoEnvios
} from "../services/whatsappService";

function assert(condicao: boolean, mensagem: string): void {
  if (!condicao) {
    console.error(`❌ FALHA: ${mensagem}`);
    throw new Error(mensagem);
  } else {
    console.log(`✅ SUCESSO: ${mensagem}`);
  }
}

async function executarBateriaDeTestes(): Promise<void> {
  console.log("==================================================");
  console.log("🧪 INICIANDO TESTES DO CHATBOT PORTMIND AI");
  console.log("==================================================\n");

  // Reset do ambiente
  resetarSessoes();
  resetarOcorrencias();
  limparHistoricoEnvios();

  // ----------------------------------------------------
  // TESTE 1: Mensagem normal e saudações
  // ----------------------------------------------------
  console.log("--- TESTE 1: Mensagem normal / Saudação ---");
  const respSaudacao = gerarResposta("operador_1", "Olá, bom dia");
  assert(
    respSaudacao.texto.includes("PortMind AI") &&
    respSaudacao.texto.includes("assistente operacional"),
    "Bot deve responder saudação contextualizada ao PortMind AI"
  );
  assert(obterEstado("operador_1") === "IDLE", "Usuário deve permanecer em IDLE");

  // ----------------------------------------------------
  // TESTE 2 & 3: Recebimento de Alerta e estado AGUARDANDO_VALIDACAO
  // ----------------------------------------------------
  console.log("\n--- TESTE 2 & 3: Alerta do PortMind e Estado AGUARDANDO_VALIDACAO ---");
  const alerta1 = {
    id: "INC-TEST-01",
    duto: "D02",
    trechoProvavel: "D-E",
    horario: "15:42",
    sensores: ["D", "E"],
    criticidade: "alta" as const,
    destinatario: "operador_duto2"
  };

  const { ocorrencia: oc1 } = await processarNovoAlerta(alerta1);
  assert(oc1.id === "INC-TEST-01", "Ocorrência criada com ID correto");
  assert(oc1.status === "AGUARDANDO_VALIDACAO", "Status da ocorrência inicial deve ser AGUARDANDO_VALIDACAO");
  assert(oc1.estadoTelemetria === "SUSPEITO", "Telemetria inicial associada deve ser SUSPEITO");
  assert(obterEstado("operador_duto2") === "AGUARDANDO_VALIDACAO", "Operador deve estar no estado AGUARDANDO_VALIDACAO");

  const mensagens = listarMensagensEnviadas();
  assert(mensagens.length === 1, "Uma notificação via WhatsApp deve ter sido disparada");
  assert(
    mensagens[0].conteudo.includes("🚨 PORTMIND AI — POSSÍVEL ANOMALIA") &&
    mensagens[0].conteudo.includes("Trecho provável: D-E") &&
    mensagens[0].conteudo.includes("A detecção estava correta?"),
    "Mensagem de alerta formatada corretamente com pergunta de confirmação"
  );

  // ----------------------------------------------------
  // TESTE 6: Resposta inválida / ambígua durante validação
  // ----------------------------------------------------
  console.log("\n--- TESTE 6: Resposta Inválida durante Validação ---");
  const respInvalida = gerarResposta("operador_duto2", "o que aconteceu?");
  assert(
    respInvalida.texto.includes("Não consegui identificar sua resposta") &&
    respInvalida.texto.includes("1 - Confirmar") &&
    respInvalida.texto.includes("2 - Rejeitar"),
    "Bot deve pedir confirmação clara em resposta ambígua"
  );
  assert(
    obterEstado("operador_duto2") === "AGUARDANDO_VALIDACAO",
    "Operador deve continuar no estado AGUARDANDO_VALIDACAO após resposta inválida"
  );

  // ----------------------------------------------------
  // TESTE 4 & 7: CONFIRMAR e Retorno para IDLE
  // ----------------------------------------------------
  console.log("\n--- TESTE 4 & 7: CONFIRMAR Validação e Retorno para IDLE ---");
  const respConfirmar = gerarResposta("operador_duto2", "1");
  assert(
    respConfirmar.texto.includes("Ocorrência confirmada"),
    "Bot deve acusar ocorrência confirmada"
  );
  assert(
    respConfirmar.validacaoHumana === "CONFIRMADA" &&
    respConfirmar.statusOcorrencia === "CONFIRMADA",
    "Resultado deve registrar CONFIRMADA"
  );

  const ocAtualizada = obterOcorrencia("INC-TEST-01");
  assert(ocAtualizada?.validacaoHumana === "CONFIRMADA", "Validação humana salva no backend como CONFIRMADA");
  assert(ocAtualizada?.status === "CONFIRMADA", "Status da ocorrência atualizado para CONFIRMADA");
  assert(obterEstado("operador_duto2") === "IDLE", "Estado do operador deve retornar para IDLE");

  // ----------------------------------------------------
  // TESTE 5: REJEITAR (Variações como 'falso positivo', 'não', '2')
  // ----------------------------------------------------
  console.log("\n--- TESTE 5: REJEITAR Validação (Falso Positivo) ---");
  const alerta2 = {
    id: "INC-TEST-02",
    duto: "D01",
    trechoProvavel: "A-B",
    horario: "16:10",
    sensores: ["A", "B"],
    destinatario: "operador_duto1"
  };
  await processarNovoAlerta(alerta2);
  assert(obterEstado("operador_duto1") === "AGUARDANDO_VALIDACAO", "Operador 1 aguardando validação");

  const respRejeitar = gerarResposta("operador_duto1", "falso positivo");
  assert(
    respRejeitar.texto.includes("Ocorrência rejeitada"),
    "Bot deve aceitar 'falso positivo' e rejeitar ocorrência"
  );
  const ocRejeitada = obterOcorrencia("INC-TEST-02");
  assert(ocRejeitada?.validacaoHumana === "REJEITADA", "Validação humana registrada como REJEITADA");
  assert(ocRejeitada?.status === "REJEITADA", "Status da ocorrência registrado como REJEITADA");
  assert(obterEstado("operador_duto1") === "IDLE", "Operador 1 retornou para IDLE");

  // ----------------------------------------------------
  // TESTE 8: Múltiplos Usuários com Estados Independentes
  // ----------------------------------------------------
  console.log("\n--- TESTE 8: Independência de Estados entre Usuários ---");
  const alertaUserA = {
    id: "INC-USER-A",
    duto: "D01",
    trechoProvavel: "B-C",
    destinatario: "usuario_A"
  };
  const alertaUserB = {
    id: "INC-USER-B",
    duto: "D03",
    trechoProvavel: "G-H",
    destinatario: "usuario_B"
  };

  await processarNovoAlerta(alertaUserA);
  await processarNovoAlerta(alertaUserB);

  assert(obterEstado("usuario_A") === "AGUARDANDO_VALIDACAO", "Usuário A aguardando");
  assert(obterEstado("usuario_B") === "AGUARDANDO_VALIDACAO", "Usuário B aguardando");
  assert(obterSessao("usuario_A").ocorrenciaPendenteId === "INC-USER-A", "Usuário A vinculado ao INC-USER-A");
  assert(obterSessao("usuario_B").ocorrenciaPendenteId === "INC-USER-B", "Usuário B vinculado ao INC-USER-B");

  // Usuário A confirma
  gerarResposta("usuario_A", "sim");
  // Usuário B rejeita
  gerarResposta("usuario_B", "não");

  assert(obterOcorrencia("INC-USER-A")?.status === "CONFIRMADA", "Ocorrência A foi confirmada");
  assert(obterOcorrencia("INC-USER-B")?.status === "REJEITADA", "Ocorrência B foi rejeitada");
  assert(obterEstado("usuario_A") === "IDLE", "Usuário A está em IDLE");
  assert(obterEstado("usuario_B") === "IDLE", "Usuário B está em IDLE");

  // ----------------------------------------------------
  // TESTE 9: Consulta de Ocorrência / Incidente
  // ----------------------------------------------------
  console.log("\n--- TESTE 9: Consulta de Incidente Secundária ---");
  const respInicioConsulta = gerarResposta("consultor_1", "quero consultar um incidente");
  assert(
    respInicioConsulta.texto.includes("Informe o código do incidente"),
    "Bot deve solicitar código do incidente"
  );
  assert(
    obterEstado("consultor_1") === "AGUARDANDO_CODIGO_CONSULTA",
    "Estado do usuário deve ser AGUARDANDO_CODIGO_CONSULTA"
  );

  const respDetalhes = gerarResposta("consultor_1", "INC-TEST-01");
  assert(
    respDetalhes.texto.includes("DETALHES DA OCORRÊNCIA [INC-TEST-01]") &&
    respDetalhes.texto.includes("Duto: D02") &&
    respDetalhes.texto.includes("Validação humana: CONFIRMADA"),
    "Bot deve exibir dados completos e formatados da ocorrência"
  );
  assert(obterEstado("consultor_1") === "IDLE", "Usuário voltou a IDLE após consulta");

  // Consulta de inexistente
  gerarResposta("consultor_1", "incidente");
  const respInexistente = gerarResposta("consultor_1", "INC-99999");
  assert(
    respInexistente.texto.includes("não foi encontrada"),
    "Bot avisa quando incidente não existe"
  );

  // ----------------------------------------------------
  // TESTE 10: Telemetria x Ocorrência & Normalização
  // ----------------------------------------------------
  console.log("\n--- TESTE 10: Separação de Telemetria x Ocorrência e Normalização ---");
  // Ocorrência INC-TEST-01 foi CONFIRMADA e está no duto D02
  atualizarStatusOcorrencia("INC-TEST-01", "EM_ATENDIMENTO", "Equipe enviada ao trecho D-E");

  const ocEmAtendimento = obterOcorrencia("INC-TEST-01");
  assert(ocEmAtendimento?.status === "EM_ATENDIMENTO", "Ocorrência colocada em EM_ATENDIMENTO");

  // Normalização da telemetria do Duto D02
  atualizarTelemetriaDuto("D02", "NORMAL", "Pressão reestabelecida nos sensores D e E");

  const ocAposNormalizacao = obterOcorrencia("INC-TEST-01");
  assert(
    ocAposNormalizacao?.estadoTelemetria === "NORMAL",
    "Telemetria do sensor foi atualizada para NORMAL"
  );
  assert(
    ocAposNormalizacao?.status === "EM_ATENDIMENTO",
    "IMPORTANTE: Normalização da telemetria NÃO deve encerrar ou alterar status de ocorrência EM_ATENDIMENTO"
  );

  console.log("\n==================================================");
  console.log("🎉 TODOS OS 10 TESTES OBRIGATÓRIOS FORAM APROVADOS!");
  console.log("==================================================\n");
}

executarBateriaDeTestes().catch((err) => {
  console.error("Erro na execução dos testes:", err);
  process.exit(1);
});
