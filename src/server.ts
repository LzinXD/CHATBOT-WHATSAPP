import express from "express";
import mensagemRoutes from "./routes/mensagemRoutes";
import alertaRoutes from "./routes/alertaRoutes";
import ocorrenciaRoutes from "./routes/ocorrenciaRoutes";
import telemetriaRoutes from "./routes/telemetriaRoutes";

export const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Rota de Healthcheck
app.get("/health", (_req, res) => {
  res.json({
    status: "online",
    servico: "PortMind AI - Chatbot WhatsApp",
    versao: "2.0.0",
    timestamp: new Date().toISOString()
  });
});

// Rotas da aplicação
app.use("/mensagem", mensagemRoutes);
app.use("/alerta", alertaRoutes);
app.use("/ocorrencias", ocorrenciaRoutes);
app.use("/telemetria", telemetriaRoutes);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🚀 [PortMind AI] Servidor rodando em http://localhost:${PORT}`);
  });
}