import { Router } from "express";
import { receberAlerta } from "../controllers/chatbotController";

const router = Router();

router.post("/", receberAlerta);

export default router;
