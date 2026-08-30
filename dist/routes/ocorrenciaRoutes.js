"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatbotController_1 = require("../controllers/chatbotController");
const router = (0, express_1.Router)();
router.get("/", chatbotController_1.listarTodasOcorrencias);
router.get("/:id", chatbotController_1.buscarOcorrenciaPorId);
router.patch("/:id/status", chatbotController_1.alterarStatusOcorrencia);
exports.default = router;
