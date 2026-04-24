const prisma = require("../config/database");

const notificacaoRepository = {
  /**
   * Cria uma nova notificação no banco
   */
  async criar(dados) {
    try {
      return await prisma.notificacao.create({
        data: {
          usuarioId: dados.usuarioId,
          tipo: dados.tipo,
          titulo: dados.titulo,
          descricao: dados.descricao,
          cidade: dados.cidade,
          lido: dados.lido || false,
        },
      });
    } catch (error) {
      console.error("Erro ao criar notificação:", error.message);
      throw error;
    }
  },

  /**
   * Busca todas as notificações de um usuário
   */
  async listarPorUsuario(usuarioId, { lido = null } = {}) {
    try {
      const where = {
        usuarioId: Number(usuarioId),
      };

      if (lido !== null) {
        where.lido = Boolean(lido);
      }

      return await prisma.notificacao.findMany({
        where,
        orderBy: {
          criadoEm: "desc",
        },
      });
    } catch (error) {
      console.error("Erro ao listar notificações:", error.message);
      throw error;
    }
  },

  async marcarComoLida(id) {
    try {
      return await prisma.notificacao.update({
        where: { id: Number(id) },
        data: { lido: true },
      });
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error.message);
      throw error;
    }
  },

  async marcarTodasComoLidas(usuarioId) {
    try {
      return await prisma.notificacao.updateMany({
        where: {
          usuarioId: Number(usuarioId),
          lido: false,
        },
        data: { lido: true },
      });
    } catch (error) {
      console.error(
        "Erro ao marcar todas as notificações como lidas:",
        error.message,
      );
      throw error;
    }
  },

  async deletar(id) {
    try {
      return await prisma.notificacao.delete({
        where: { id: Number(id) },
      });
    } catch (error) {
      console.error("Erro ao deletar notificação:", error.message);
      throw error;
    }
  },

  async contarNaoLidas(usuarioId) {
    try {
      return await prisma.notificacao.count({
        where: {
          usuarioId: Number(usuarioId),
          lido: false,
        },
      });
    } catch (error) {
      console.error("Erro ao contar notificações não lidas:", error.message);
      throw error;
    }
  },

  async listarPorTipo(usuarioId, tipo) {
    try {
      return await prisma.notificacao.findMany({
        where: {
          usuarioId: Number(usuarioId),
          tipo,
        },
        orderBy: {
          criadoEm: "desc",
        },
      });
    } catch (error) {
      console.error("Erro ao listar notificações por tipo:", error.message);
      throw error;
    }
  },
};

module.exports = notificacaoRepository;
