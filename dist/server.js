"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const mensagemRoutes_1 = __importDefault(require("./routes/mensagemRoutes"));
const alertaRoutes_1 = __importDefault(require("./routes/alertaRoutes"));
const ocorrenciaRoutes_1 = __importDefault(require("./routes/ocorrenciaRoutes"));
const telemetriaRoutes_1 = __importDefault(require("./routes/telemetriaRoutes"));
exports.app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
exports.app.use(express_1.default.json());
// Rota de Healthcheck
exports.app.get("/health", (_req, res) => {
    res.json({
        status: "online",
        servico: "PortMind AI - Chatbot WhatsApp",
        versao: "2.0.0",
        timestamp: new Date().toISOString()
    });
});
// Rotas da aplicação
exports.app.use("/mensagem", mensagemRoutes_1.default);
exports.app.use("/alerta", alertaRoutes_1.default);
exports.app.use("/ocorrencias", ocorrenciaRoutes_1.default);
exports.app.use("/telemetria", telemetriaRoutes_1.default);
if (process.env.NODE_ENV !== "test") {
    exports.app.listen(PORT, () => {
        console.log(`🚀 [PortMind AI] Servidor rodando em http://localhost:${PORT}`);
    });
}
