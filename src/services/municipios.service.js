const prisma = require("../config/database");

async function listarTodos() {
  return prisma.municipioMG.findMany();
}

async function buscarPorNome(nome) {
  return prisma.municipioMG.findMany({
    where: {
      municipio: {
        contains: nome,
        mode: "insensitive",
      },
    },
  });
}

async function filtrarPorBioma(bioma) {
  return prisma.municipioMG.findMany({
    where: {
      bioma_mais_afetado: bioma,
    },
  });
}

async function filtrarPorClassificacao(classificacao) {
  return prisma.municipioMG.findMany({
    where: {
      classificacao_imri: classificacao,
    },
  });
}

async function rankingFocos() {
  return prisma.municipioMG.findMany({
    orderBy: {
      numero_focos: "desc",
    },
    take: 10,
  });
}

module.exports = {
  listarTodos,
  buscarPorNome,
  filtrarPorBioma,
  filtrarPorClassificacao,
  rankingFocos,
};
