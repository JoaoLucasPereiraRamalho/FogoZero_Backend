const prisma = require("../config/database");

class QueimadaRepository {
  async buscarPorFiltros(filtros) {
    // Monta o objeto de filtro dinamicamente
    const where = {};

    if (filtros.id_regiao) {
      where.id_regiao = filtros.id_regiao;
    }

    // Filtro por intervalo de datas (maior ou igual, menor ou igual)
    if (filtros.data_inicio || filtros.data_fim) {
      where.data_registro = {};
      if (filtros.data_inicio) where.data_registro.gte = filtros.data_inicio;
      if (filtros.data_fim) where.data_registro.lte = filtros.data_fim;
    }

    // Executa a busca no banco trazendo os dados da Região junto
    return await prisma.registroQueimada.findMany({
      where,
      include: {
        regiao: {
          select: { nome: true, tipo_regiao: true },
        },
      },
      orderBy: {
        data_registro: "desc", // Retorna os mais recentes primeiro
      },
    });
  }
}

module.exports = new QueimadaRepository();
