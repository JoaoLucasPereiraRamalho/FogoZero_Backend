const prisma = require("../config/database");

const monitoramentoRepository = {
  /**
   * Busca todos os usuários que monitoram uma cidade específica.
   * Útil para o serviço de alertas disparar e-mails.
   */
  async buscarInteressadosPorCidade(cidade) {
    return await prisma.monitoramento.findMany({
      where: {
        cidade: {
          equals: cidade,
          mode: "insensitive",
        },
        notificar: true,
      },
      include: {
        usuario: true,
      },
    });
  },

  /**
   * Cria um novo registro de monitoramento para um usuário.
   */
  async criar(dados) {
    return await prisma.monitoramento.create({
      data: {
        cidade: dados.cidade,
        estado: dados.estado || "MG",
        usuarioId: dados.usuarioId,
        notificar: dados.notificar !== undefined ? dados.notificar : true,
      },
    });
  },

  /**
   * Lista todas as cidades que um usuário específico está monitorando.
   */
  async listarPorUsuario(usuarioId) {
    return await prisma.monitoramento.findMany({
      where: {
        usuarioId: Number(usuarioId),
      },
      orderBy: {
        cidade: "asc",
      },
    });
  },

  /**
   * Remove um monitoramento específico.
   */
  async deletar(id) {
    return await prisma.monitoramento.delete({
      where: { id: Number(id) },
    });
  },
};

module.exports = monitoramentoRepository;
