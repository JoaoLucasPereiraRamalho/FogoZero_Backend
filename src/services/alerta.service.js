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

        // LOGICA DE ENVIO (Simulada)
        console.log(`--------------------------------------------------`);
        console.log(`📧 ENVIANDO E-MAIL PARA: ${email}`);
        console.log(`Olá ${nome}, o FogoZero detectou um novo registro:`);
        console.log(`📍 Local: ${cidade} - MG`);
        console.log(`📝 Detalhes: ${titulo}`);
        console.log(`--------------------------------------------------`);

        // Aqui no futuro você faz: await transport.sendMail({...})
      });
    } catch (error) {
      console.error("❌ Erro ao processar alertas:", error.message);
    }
  },
};

module.exports = alertaService;
