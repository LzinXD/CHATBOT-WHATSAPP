import express from "express";
import mensagemRoutes from "./routes/mensagemRoutes";

const app = express();
const PORT = 3000;

app.use(express.json());

app.use("/mensagem", mensagemRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});