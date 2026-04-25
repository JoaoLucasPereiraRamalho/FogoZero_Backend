const prisma = require("../config/database");

class QueimadaRepository {
  async buscarPorFiltros(filtros) {
    const where = {};

    if (filtros.id_regiao) {
      where.id_regiao = filtros.id_regiao;
    }

    if (filtros.data_inicio || filtros.data_fim) {
      where.data_registro = {};
      if (filtros.data_inicio) where.data_registro.gte = filtros.data_inicio;
      if (filtros.data_fim) where.data_registro.lte = filtros.data_fim;
    }

    return await prisma.registroQueimada.findMany({
      where,
      include: {
        regiao: {
          select: { nome: true, tipo_regiao: true },
        },
      },
      orderBy: {
        data_registro: "desc",
      },
    });
  }

  async criar(dados) {
    return await prisma.registroQueimada.create({
      data: {
        id_regiao: dados.id_regiao,
        quantidade_focos: dados.quantidade_focos,
        fonte_dados: dados.fonte_dados,
        data_registro: dados.data_registro,
      },
    });
  }
}

module.exports = new QueimadaRepository();
