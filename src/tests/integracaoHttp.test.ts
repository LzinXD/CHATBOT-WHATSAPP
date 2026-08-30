import { app } from "../server";
import { Server } from "http";

function assert(condicao: boolean, mensagem: string): void {
  if (!condicao) {
    console.error(`❌ FALHA NO TESTE HTTP: ${mensagem}`);
    throw new Error(mensagem);
  } else {
    console.log(`✅ SUCESSO HTTP: ${mensagem}`);
  }
}

async function testarIntegracaoHttp(): Promise<void> {
  console.log("\n==================================================");
  console.log("🌐 INICIANDO TESTES DE INTEGRAÇÃO HTTP (API REST)");
  console.log("==================================================\n");

  const PORT = 3099;
  const server: Server = app.listen(PORT);
  const baseUrl = `http://localhost:${PORT}`;

  try {
    // 1. Healthcheck
    const resHealth = await fetch(`${baseUrl}/health`);
    const jsonHealth = await resHealth.json();
    assert(jsonHealth.status === "online", "Healthcheck online");

    // 2. PortMind AI emite alerta para operador WhatsApp
    const resAlerta = await fetch(`${baseUrl}/alerta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "INC-HTTP-555",
        duto: "D02",
        trechoProvavel: "D-E",
        horario: "15:42",
        sensores: ["D", "E"],
        criticidade: "alta",
        destinatario: "+5511999998888"
      })
    });
    const jsonAlerta = await resAlerta.json();
    assert(resAlerta.status === 201, "Status 201 ao criar alerta");
    assert(jsonAlerta.ocorrencia.id === "INC-HTTP-555", "Ocorrência HTTP registrada com ID correto");

    // 3. Operador responde com dúvida (resposta inválida/ambígua)
    const resAmbiguo = await fetch(`${baseUrl}/mensagem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario: "+5511999998888",
        mensagem: "onde fica?"
      })
    });
    const jsonAmbiguo = await resAmbiguo.json();
    assert(jsonAmbiguo.resposta.includes("Não consegui identificar sua resposta"), "Orientação do bot em resposta ambígua");

    // 4. Operador responde '1' (CONFIRMAR)
    const resConfirmacao = await fetch(`${baseUrl}/mensagem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario: "+5511999998888",
        mensagem: "confirmar"
      })
    });
    const jsonConfirmacao = await resConfirmacao.json();
    assert(jsonConfirmacao.validacaoHumana === "CONFIRMADA", "Validação humana confirmada via HTTP");
    assert(jsonConfirmacao.statusOcorrencia === "CONFIRMADA", "Status da ocorrência confirmado via HTTP");

    // 5. Consultar ocorrência via GET /ocorrencias/:id
    const resConsulta = await fetch(`${baseUrl}/ocorrencias/INC-HTTP-555`);
    const jsonConsulta = await resConsulta.json();
    assert(jsonConsulta.ocorrencia.validacaoHumana === "CONFIRMADA", "Consulta HTTP reflete validação humana");

    // 6. Atualização de telemetria (normalização) via POST /telemetria/normalizacao
    const resTelemetria = await fetch(`${baseUrl}/telemetria/normalizacao`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        duto: "D02",
        estadoTelemetria: "NORMAL",
        observacao: "Pressão estabilizada após manobra"
      })
    });
    const jsonTelemetria = await resTelemetria.json();
    assert(jsonTelemetria.sucesso === true, "Telemetria atualizada com sucesso");

    // 7. Verificar se a ocorrência mantém status CONFIRMADA e telemetria NORMAL
    const resConsultaFinal = await fetch(`${baseUrl}/ocorrencias/INC-HTTP-555`);
    const jsonConsultaFinal = await resConsultaFinal.json();
    assert(jsonConsultaFinal.ocorrencia.status === "CONFIRMADA", "Status da ocorrência continua CONFIRMADA");
    assert(jsonConsultaFinal.ocorrencia.estadoTelemetria === "NORMAL", "Telemetria atualizada para NORMAL");

    console.log("\n==================================================");
    console.log("🎉 TODOS OS TESTES DE INTEGRAÇÃO HTTP PASSARAM!");
    console.log("==================================================\n");
  } finally {
    server.close();
  }
}

testarIntegracaoHttp().catch((err) => {
  console.error("Erro nos testes HTTP:", err);
  process.exit(1);
});
