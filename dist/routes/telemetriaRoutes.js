"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatbotController_1 = require("../controllers/chatbotController");
const router = (0, express_1.Router)();
router.post("/normalizacao", chatbotController_1.atualizarTelemetria);
exports.default = router;
