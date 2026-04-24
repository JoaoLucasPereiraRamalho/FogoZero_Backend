const monitoramentoRepository = require("../repositories/monitoramento.repository");
const notificacaoRepository = require("../repositories/notificacao.repository");
const emailService = require("./email.service");

const alertaService = {
  /**
   * Notifica usuários quando uma queimada é registrada em uma cidade monitorada
   * @param {string} cidade - Nome da cidade
   * @param {number} quantidade_focos - Quantidade de focos detectados
   * @param {string} fonte_dados - Fonte dos dados (INPE, Satélite, etc)
   * @param {Date} data_registro - Data do registro
   */
  async notificarQueimada(
    cidade,
    quantidade_focos,
    fonte_dados,
    data_registro,
  ) {
    console.log(
      `🔥 [QUEIMADA] Processando alerta para ${cidade} com ${quantidade_focos} focos...`,
    );

    try {
      const interessados =
        await monitoramentoRepository.buscarInteressadosPorCidade(cidade);

      if (interessados.length === 0) {
        console.log(`ℹ️  Nenhum usuário monitorando queimadas em: ${cidade}`);
        return;
      }

      const titulo = `🔥 ALERTA DE QUEIMADA em ${cidade}`;
      const descricao = `${quantidade_focos} focos de incêndio detectados via ${fonte_dados}`;

      console.log(
        `📢 Notificando ${interessados.length} usuários sobre queimada em ${cidade}`,
      );

      for (const item of interessados) {
        const { id: monitoramentoId, usuario } = item;

        await this.enviarNotificacao({
          usuarioId: usuario.id,
          monitoramentoId,
          tipo: "QUEIMADA",
          titulo,
          descricao,
          cidade,
          estado: "MG",
          usuarioEmail: usuario.email,
          usuarioNome: usuario.nome,
        });
      }
    } catch (error) {
      console.error("❌ Erro ao processar alertas de queimada:", error.message);
    }
  },

  /**
   * Notifica usuários quando uma notícia é importada sobre uma cidade monitorada
   * @param {string} titulo - Título da notícia
   * @param {string} descricao - Descrição/conteúdo da notícia
   * @param {string} cidade - Cidade mencionada na notícia
   * @param {string} fonte_url - URL da notícia original
   */
  async notificarNoticia(titulo, descricao, cidade, fonte_url) {
    console.log(`📰 [NOTÍCIA] Processando alerta para ${cidade}...`);

    try {
      const interessados =
        await monitoramentoRepository.buscarInteressadosPorCidade(cidade);

      if (interessados.length === 0) {
        console.log(`ℹ️  Nenhum usuário monitorando notícias em: ${cidade}`);
        return;
      }

      const tituloAlerta = `📰 NOTÍCIA sobre ${cidade}`;
      const descricaoAlerta = descricao.substring(0, 200) + "...";

      console.log(
        `📢 Notificando ${interessados.length} usuários sobre notícia em ${cidade}`,
      );

      for (const item of interessados) {
        const { id: monitoramentoId, usuario } = item;

        await this.enviarNotificacao({
          usuarioId: usuario.id,
          monitoramentoId,
          tipo: "NOTICIA",
          titulo: tituloAlerta,
          descricao: descricaoAlerta,
          cidade,
          estado: "MG",
          usuarioEmail: usuario.email,
          usuarioNome: usuario.nome,
          fonte_url,
        });
      }
    } catch (error) {
      console.error("❌ Erro ao processar alertas de notícia:", error.message);
    }
  },

  /**
   * Notifica usuários quando um reporte é criado em uma cidade monitorada
   * @param {string} cidade - Cidade do reporte
   * @param {string} assunto - Assunto do reporte
   * @param {number} reporteId - ID do reporte
   */
  async notificarReporte(cidade, assunto, reporteId) {
    console.log(`📍 [REPORTE] Processando alerta para ${cidade}...`);

    try {
      const interessados =
        await monitoramentoRepository.buscarInteressadosPorCidade(cidade);

      if (interessados.length === 0) {
        console.log(`ℹ️  Nenhum usuário monitorando reportes em: ${cidade}`);
        return;
      }

      const titulo = `📍 REPORTE em ${cidade}`;
      const descricao = assunto
        ? `Novo reporte: ${assunto}`
        : "Novo reporte de incêndio";

      console.log(
        `📢 Notificando ${interessados.length} usuários sobre reporte em ${cidade}`,
      );

      for (const item of interessados) {
        const { id: monitoramentoId, usuario } = item;

        await this.enviarNotificacao({
          usuarioId: usuario.id,
          monitoramentoId,
          tipo: "REPORTE",
          titulo,
          descricao,
          cidade,
          estado: "MG",
          usuarioEmail: usuario.email,
          usuarioNome: usuario.nome,
          reporteId,
        });
      }
    } catch (error) {
      console.error("❌ Erro ao processar alertas de reporte:", error.message);
    }
  },

  async enviarNotificacao(dados) {
    try {
      const notificacao = await notificacaoRepository.criar({
        usuarioId: dados.usuarioId,
        tipo: dados.tipo,
        titulo: dados.titulo,
        descricao: dados.descricao,
        cidade: dados.cidade,
        lido: false,
      });

      await emailService.enviarEmail(
        dados.usuarioEmail,
        dados.titulo,
        `Olá ${dados.usuarioNome},\n\n${dados.descricao}\n\n📍 Cidade: ${dados.cidade}\n🏷️ Tipo: ${dados.tipo}\n\nAtenciosamente,\nEquipe FogoZero MG`,
      );
      this.enviarEmail(
        dados.usuarioEmail,
        dados.usuarioNome,
        dados.titulo,
        dados.descricao,
        dados.cidade,
        dados.tipo,
      );

      console.log(
        `✅ Notificação criada para ${dados.usuarioEmail} (ID: ${notificacao.id})`,
      );

      return notificacao;
    } catch (error) {
      console.error(
        `❌ Erro ao enviar notificação para ${dados.usuarioEmail}:`,
        error.message,
      );
    }
  },

  enviarEmail(email, nome, titulo, descricao, cidade, tipo) {
    const timestamp = new Date().toLocaleString("pt-BR");

    console.log(`\n${"=".repeat(60)}`);
    console.log(`📧 EMAIL ENVIADO`);
    console.log(`${"=".repeat(60)}`);
    console.log(`Para: ${email}`);
    console.log(`Nome: ${nome}`);
    console.log(`Data: ${timestamp}`);
    console.log(`${"=".repeat(60)}`);
    console.log(`Assunto: ${titulo}`);
    console.log(`${"=".repeat(60)}`);
    console.log(`Olá ${nome},`);
    console.log();
    console.log(`${descricao}`);
    console.log();
    console.log(`📍 Cidade: ${cidade}`);
    console.log(`🏷️  Tipo: ${tipo}`);
    console.log();
    console.log(
      `Para gerenciar suas notificações, acesse: http://localhost:3000/monitoramentos`,
    );
    console.log();
    console.log(`Atenciosamente,`);
    console.log(`FogoZero MG - Sistema de Alertas`);
    console.log(`${"=".repeat(60)}\n`);
  },
};

module.exports = alertaService;
