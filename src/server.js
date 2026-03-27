const express = require("express");
const reporteRoutes = require("./routes/reporte.routes");

const app = express();

app.use(express.json());

app.get("/ping", (req, res) => {
  return res.status(200).json({
    mensagem: "A API do FogoZero MG está no ar! 🚀",
    status: "online",
  });
});

app.use("/api/reportes", reporteRoutes);

const PORT = process.env.PORT || 3000;

const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}/ping`);
  console.log(`Acesse Rotas de Reporte: http://localhost:${PORT}/api/reportes`);
});
