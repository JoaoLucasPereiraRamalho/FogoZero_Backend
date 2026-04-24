const prisma = require("../config/database");

async function findAll() {
  return prisma.tipoRegiao.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      descricao: true,
      _count: {
        select: { regioes: true },
      },
    },
  });
}

async function findById(id) {
  return prisma.tipoRegiao.findUnique({
    where: { id },
    select: {
      id: true,
      descricao: true,
      regioes: {
        select: {
          id: true,
          nome: true,
        },
        orderBy: { nome: "asc" },
      },
    },
  });
}

async function findRegistrosByBiomaId({ biomaId, skip, take, where }) {
  return prisma.registroQueimada.findMany({
    where: {
      ...where,
      regiao: { id_tipo_regiao: biomaId },
    },
    skip,
    take,
    orderBy: [{ data_registro: "desc" }, { id: "desc" }],
    include: {
      regiao: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  });
}

async function countRegistrosByBiomaId({ biomaId, where }) {
  return prisma.registroQueimada.count({
    where: {
      ...where,
      regiao: { id_tipo_regiao: biomaId },
    },
  });
}

module.exports = {
  findAll,
  findById,
  findRegistrosByBiomaId,
  countRegistrosByBiomaId,
};
