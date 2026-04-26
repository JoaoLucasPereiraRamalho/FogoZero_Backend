require("dotenv").config();

const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const reporteRoutes = require("./routes/reporte.routes");
const educativoRoutes = require("./routes/educativo.routes");
const queimadaRoutes = require("./routes/queimada.routes");
const noticiaRoutes = require("./routes/noticia.routes");
const monitoramentoRoutes = require("./routes/monitoramento.routes");
const notificacaoRoutes = require("./routes/notificacao.routes");
const municipioRoutes = require("./routes/municipios.routes");
const graficosRoutes = require("./routes/graficos.routes");
const biomaRoutes = require("./routes/bioma.routes");
const usuarioRoutes = require("./routes/usuario.routes");
const errorHandler = require("./middlewares/errorHandler");
const setupSwagger = require("./swagger");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  return res.redirect("/api-docs");
});

app.get("/ping", (req, res) => {
  return res.status(200).json({
    mensagem: "A API do FogoZero MG está no ar! 🚀",
    status: "online",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/reportes", reporteRoutes);
app.use("/api/educativo", educativoRoutes);
app.use("/api/queimadas", queimadaRoutes);
app.use("/api/noticias", noticiaRoutes);
app.use("/api/monitoramentos", monitoramentoRoutes);
app.use("/api/notificacoes", notificacaoRoutes);
app.use("/api/municipios", municipioRoutes);
app.use("/api/graficos", graficosRoutes);
app.use("/api/biomas", biomaRoutes);
app.use("/api/usuarios", usuarioRoutes);
setupSwagger(app);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}/ping`);
  console.log(`Acesse Swagger: http://localhost:${PORT}/api-docs`);

  agendarImportacaoNoticias();
});

// ─── Importação automática de notícias ────────────────────────────────────
// Roda 30s após o boot (dá tempo das migrations terminarem) e a cada 24h.
// Notícias entram como PENDENTE e exigem aprovação manual.
function agendarImportacaoNoticias() {
  const noticiaController = require("./controllers/noticia.controller");
  const INTERVALO_MS = 24 * 60 * 60 * 1000; // 24 horas
  const ATRASO_INICIAL_MS = 30 * 1000; // 30 segundos
  const AUTOR_ID_PADRAO = 1;

  const executar = async () => {
    const importId = `auto_${Date.now()}`;
    noticiaController.importacaoStatus[importId] = {
      id: importId,
      status: "processando",
      total: 0,
      salvas: 0,
      erros: 0,
      dataInicio: new Date(),
      dataFim: null,
      mensagem: "Importação automática iniciada",
    };
    console.log(
      `\n⏰ [${importId}] Importação automática de notícias iniciando...`,
    );
    try {
      await noticiaController.processarImportacao(importId, AUTOR_ID_PADRAO);
    } catch (err) {
      console.error(
        `💥 [${importId}] Falha na importação automática: ${err.message}`,
      );
    }
  };

  setTimeout(executar, ATRASO_INICIAL_MS);
  setInterval(executar, INTERVALO_MS);
}
