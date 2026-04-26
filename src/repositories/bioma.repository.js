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

async function sumFocosAnuaisByBiomaId({ biomaId, ano }) {
  const result = await prisma.registroQueimada.aggregate({
    where: {
      regiao: { id_tipo_regiao: biomaId },
      data_registro: {
        gte: new Date(ano, 0, 1),
        lte: new Date(ano, 11, 31, 23, 59, 59),
      },
    },
    _sum: { quantidade_focos: true },
  });
  return result._sum.quantidade_focos ?? 0;
}

async function findRegistrosMensaisByBiomaId({ biomaId, ano }) {
  return prisma.registroQueimada.findMany({
    where: {
      regiao: { id_tipo_regiao: biomaId },
      data_registro: {
        gte: new Date(ano, 0, 1),
        lte: new Date(ano, 11, 31, 23, 59, 59),
      },
    },
    select: {
      data_registro: true,
      quantidade_focos: true,
    },
    orderBy: { data_registro: "asc" },
  });
}

async function findAnosDisponiveis() {
  const result = await prisma.$queryRaw`
    SELECT DISTINCT EXTRACT(YEAR FROM data_registro)::int AS ano
    FROM registro_queimada
    WHERE data_registro IS NOT NULL
    ORDER BY ano DESC
  `;
  return result.map((r) => r.ano);
}

module.exports = {
  findAll,
  findById,
  findRegistrosByBiomaId,
  countRegistrosByBiomaId,
  sumFocosAnuaisByBiomaId,
  findRegistrosMensaisByBiomaId,
  findAnosDisponiveis,
};
