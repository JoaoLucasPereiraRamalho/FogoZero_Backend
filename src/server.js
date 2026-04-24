require("dotenv").config();

const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const reporteRoutes = require("./routes/reporte.routes");
const educativoRoutes = require("./routes/educativo.routes");
const biomaRoutes = require("./routes/bioma.routes");
const errorHandler = require("./middlewares/errorHandler");
const setupSwagger = require("./swagger");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/ping", (req, res) => {
  return res.status(200).json({
    mensagem: "A API do FogoZero MG está no ar! 🚀",
    status: "online",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/reportes", reporteRoutes);
app.use("/api/educativo", educativoRoutes);
app.use("/api/biomas", biomaRoutes);
setupSwagger(app);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}/ping`);
  console.log(`Acesse Rotas de Auth: http://localhost:${PORT}/api/auth`);
  console.log(`Acesse Rotas de Reporte: http://localhost:${PORT}/api/reportes`);
  console.log(
    `Acesse Rotas Educativas: http://localhost:${PORT}/api/educativo`,
  );
  console.log(`Acesse Rotas de Biomas: http://localhost:${PORT}/api/biomas`);
  console.log(`Acesse Swagger: http://localhost:${PORT}/api-docs`);
});
