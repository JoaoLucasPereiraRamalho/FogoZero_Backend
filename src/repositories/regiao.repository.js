const prisma = require("../config/database");

const regiaoRepository = {
  /**
   * Busca uma região pelo ID para obter o nome da cidade
   */
  async findById(id) {
    try {
      return await prisma.regiao.findUnique({
        where: { id: Number(id) },
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lista todas as regiões (útil para preencher selects no frontend)
   */
  async listarTodas() {
    return await prisma.regiao.findMany({
      orderBy: { nome: "asc" },
    });
  },
};

module.exports = regiaoRepository;
