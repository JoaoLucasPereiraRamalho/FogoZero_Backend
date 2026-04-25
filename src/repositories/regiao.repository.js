const prisma = require("../config/database");

const regiaoRepository = {
  async findById(id) {
    try {
      return await prisma.regiao.findUnique({
        where: { id: Number(id) },
      });
    } catch (error) {
      throw error;
    }
  },

  async listarTodas() {
    return await prisma.regiao.findMany({
      orderBy: { nome: "asc" },
    });
  },
};

module.exports = regiaoRepository;
