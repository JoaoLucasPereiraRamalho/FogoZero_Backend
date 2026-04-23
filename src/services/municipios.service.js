const prisma = require('../config/database');

class MunicipioService {

  async listarTodos() {
    return await prisma.municipioMG.findMany();
  }

  async buscarPorNome(nome) {
    return await prisma.municipioMG.findMany({
      where: {
        municipio: {
          contains: nome,
          mode: 'insensitive'
        }
      }
    });
  }

  async filtrarPorBioma(bioma) {
    return await prisma.municipioMG.findMany({
      where: {
        bioma_mais_afetado: bioma
      }
    });
  }

  async filtrarPorClassificacao(classificacao) {
    return await prisma.municipioMG.findMany({
      where: {
        classificacao_imri: classificacao
      }
    });
  }

  async rankingFocos() {
    return await prisma.municipioMG.findMany({
      orderBy: {
        numero_focos: 'desc'
      },
      take: 10
    });
  }

}

module.exports = new MunicipioService();