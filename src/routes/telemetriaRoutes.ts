import { Router } from "express";
import { atualizarTelemetria } from "../controllers/chatbotController";

const router = Router();

router.post("/normalizacao", atualizarTelemetria);

export default router;
