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

async function estatisticasImri() {
  const grupos = await prisma.municipioMG.groupBy({
    by: ["classificacao_imri"],
    _count: { id: true },
    _avg: { imri: true },
    _min: { imri: true },
    _max: { imri: true },
    orderBy: { _avg: { imri: "desc" } },
  });

  return grupos.map((g) => ({
    classificacao: g.classificacao_imri,
    total_municipios: g._count.id,
    imri_medio: g._avg.imri !== null ? Number(g._avg.imri.toFixed(4)) : null,
    imri_min: g._min.imri,
    imri_max: g._max.imri,
  }));
}

async function rankingImri(limit = 10) {
  return prisma.municipioMG.findMany({
    orderBy: { imri: "desc" },
    take: limit,
    select: {
      municipio: true,
      imri: true,
      classificacao_imri: true,
      numero_focos: true,
      bioma_mais_afetado: true,
    },
  });
}

async function evolucaoHistorica(municipio) {
  const registro = await prisma.municipioMG.findUnique({
    where: { municipio },
    select: {
      municipio: true,
      focos_2015: true,
      focos_2016: true,
      focos_2017: true,
      focos_2018: true,
      focos_2019: true,
      focos_2020: true,
      focos_2021: true,
      focos_2022: true,
      focos_2023: true,
      focos_2024: true,
      focos_2025: true,
    },
  });

  if (!registro) return null;

  const serie = Object.entries(registro)
    .filter(([key]) => key.startsWith("focos_"))
    .map(([key, value]) => ({
      ano: Number(key.replace("focos_", "")),
      focos: value,
    }))
    .sort((a, b) => a.ano - b.ano);

  return { municipio: registro.municipio, evolucao: serie };
}

module.exports = {
  listarTodos,
  buscarPorNome,
  filtrarPorBioma,
  filtrarPorClassificacao,
  rankingFocos,
  estatisticasImri,
  rankingImri,
  evolucaoHistorica,
};
