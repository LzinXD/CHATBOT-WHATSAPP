import { Router } from "express";
import { responderMensagem } from "../controllers/chatbotController";

const router = Router();

router.post("/", responderMensagem);

export default router;
