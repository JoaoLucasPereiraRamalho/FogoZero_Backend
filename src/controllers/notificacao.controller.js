const notificacaoRepository = require("../repositories/notificacao.repository");

const notificacaoController = {
  async index(req, res) {
    try {
      const { userId } = req.user;
      const { lido, tipo } = req.query;

      let notificacoes;

      if (tipo) {
        notificacoes = await notificacaoRepository.listarPorTipo(userId, tipo);
      } else if (lido !== undefined) {
        notificacoes = await notificacaoRepository.listarPorUsuario(userId, {
          lido: lido === "true",
        });
      } else {
        notificacoes = await notificacaoRepository.listarPorUsuario(userId);
      }

      const naoLidas = await notificacaoRepository.contarNaoLidas(userId);

      return res.json({
        mensagem: "Notificações listadas com sucesso",
        total: notificacoes.length,
        naoLidas,
        notificacoes,
      });
    } catch (error) {
      console.error("Erro ao listar notificações:", error.message);
      return res.status(500).json({
        erro: error.message,
        mensagem: "Erro ao listar notificações",
      });
    }
  },

  async marcarComoLida(req, res) {
    try {
      const { id } = req.params;

      const notificacao = await notificacaoRepository.marcarComoLida(id);

      return res.json({
        mensagem: "Notificação marcada como lida",
        notificacao,
      });
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error.message);
      return res.status(500).json({
        erro: error.message,
        mensagem: "Erro ao marcar notificação como lida",
      });
    }
  },

  async marcarTodasComoLidas(req, res) {
    try {
      const { userId } = req.user;

      const resultado =
        await notificacaoRepository.marcarTodasComoLidas(userId);

      return res.json({
        mensagem: "Todas as notificações foram marcadas como lidas",
        atualizadas: resultado.count,
      });
    } catch (error) {
      console.error(
        "Erro ao marcar todas as notificações como lidas:",
        error.message,
      );
      return res.status(500).json({
        erro: error.message,
        mensagem: "Erro ao marcar todas as notificações como lidas",
      });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;

      await notificacaoRepository.deletar(id);

      return res.status(204).json();
    } catch (error) {
      console.error("Erro ao deletar notificação:", error.message);
      return res.status(500).json({
        erro: error.message,
        mensagem: "Erro ao deletar notificação",
      });
    }
  },

  async contarNaoLidas(req, res) {
    try {
      const { usuarioId } = req.user;

      const total = await notificacaoRepository.contarNaoLidas(usuarioId);

      return res.json({
        naoLidas: total,
      });
    } catch (error) {
      console.error("Erro ao contar notificações não lidas:", error.message);
      return res.status(500).json({
        erro: error.message,
        mensagem: "Erro ao contar notificações não lidas",
      });
    }
  },
};

module.exports = notificacaoController;
