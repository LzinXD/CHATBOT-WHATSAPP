const express = require("express");

const app = express();

const mensagemRoutes = require("./routes/mensagem");

app.use(express.json());

app.use("/mensagem", mensagemRoutes);

app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});