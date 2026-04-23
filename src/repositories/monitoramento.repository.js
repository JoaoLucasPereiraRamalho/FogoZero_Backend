const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const monitoramentoRepository = {
  // Busca todos os usuários que monitoram uma cidade específica
  async buscarInteressadosPorCidade(cidade) {
    return await prisma.monitoramento.findMany({
      where: {
        cidade: { equals: cidade, mode: "insensitive" },
        notificar: true,
      },
      include: {
        usuario: true, // Traz os dados do usuário (email, nome) junto
      },
    });
  },

  async criar(dados) {
    return await prisma.monitoramento.create({ data: dados });
  },

  async listarPorUsuario(usuarioId) {
    return await prisma.monitoramento.findMany({ where: { usuarioId } });
  },
};

module.exports = monitoramentoRepository;
