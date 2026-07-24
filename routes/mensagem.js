const express = require("express");
const router = express.Router();

const {
    responderMensagem
} = require("../controllers/chatbotController");

router.post("/", responderMensagem);

module.exports = router;