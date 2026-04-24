const prisma = require("../config/database");

const monitoramentoRepository = {
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

  async deletar(id) {
    return await prisma.monitoramento.delete({
      where: { id: Number(id) },
    });
  },
};

module.exports = monitoramentoRepository;
