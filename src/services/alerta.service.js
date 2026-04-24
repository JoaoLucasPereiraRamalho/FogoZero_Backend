const monitoramentoRepository = require("../repositories/monitoramento.repository");

const alertaService = {
  /**
   * Processa um evento de incêndio e avisa os interessados
   * @param {string} cidade - Nome da cidade detectada
   * @param {string} origem - 'NOTÍCIA' ou 'REPORTE'
   * @param {string} titulo - Título do alerta
   */
  async processarNovoEvento(cidade, origem, titulo) {
    console.log(`📢 [ALERTA] Processando evento de ${origem} em ${cidade}...`);

    try {
      const interessados =
        await monitoramentoRepository.buscarInteressadosPorCidade(cidade);

      if (interessados.length === 0) {
        console.log(`ℹ️  Nenhum usuário monitorando a cidade: ${cidade}`);
        return;
      }

      console.log(
        `🔥 Notificando ${interessados.length} usuários sobre: ${titulo}`,
      );

      interessados.forEach((item) => {
        const { nome, email } = item.usuario;

        let mensagemContexto = "";
        if (origem === "QUEIMADA") {
          mensagemContexto = `Focos de incêndio detectados via Satélite (INPE/Monitoramento).`;
        } else if (origem === "REPORTE") {
          mensagemContexto = `Um cidadão reportou um foco de incêndio próximo a você.`;
        } else {
          mensagemContexto = `Nova notícia relevante publicada sobre a região.`;
        }
        // LOGICA DE ENVIO (Simulada)
        console.log(`--------------------------------------------------`);
        console.log(`📧 ENVIANDO E-MAIL PARA: ${email}`);
        console.log(
          `Olá ${nome}, o sistema FogoZero tem um novo alerta para você:`,
        );
        console.log(`⚠️  Tipo: ${origem}`);
        console.log(`📍 Local: ${cidade} - MG`);
        console.log(`ℹ️  Contexto: ${mensagemContexto}`);
        console.log(`📝 Detalhes: ${informacao}`);
        console.log(`--------------------------------------------------`);
      });
    } catch (error) {
      console.error("❌ Erro ao processar alertas:", error.message);
    }
  },
};

module.exports = alertaService;
