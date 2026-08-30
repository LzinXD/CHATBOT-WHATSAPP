import { Router } from "express";
import {
  listarTodasOcorrencias,
  buscarOcorrenciaPorId,
  alterarStatusOcorrencia
} from "../controllers/chatbotController";

const router = Router();

router.get("/", listarTodasOcorrencias);
router.get("/:id", buscarOcorrenciaPorId);
router.patch("/:id/status", alterarStatusOcorrencia);

export default router;
