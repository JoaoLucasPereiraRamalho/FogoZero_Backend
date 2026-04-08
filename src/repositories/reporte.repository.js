const prisma = require("../config/database");

const reporteInclude = {
  usuario: {
    select: {
      id: true,
      nome: true,
      email: true,
      tipo: true,
      id_regiao: true,
    },
  },
  status_analise_ia: {
    select: {
      id: true,
      descricao: true,
    },
  },
  status_analise_admin: {
    select: {
      id: true,
      descricao: true,
    },
  },
};

async function createReporte(data) {
  return prisma.reporte.create({
    data,
    include: reporteInclude,
  });
}

async function findById(id) {
  return prisma.reporte.findUnique({
    where: { id },
    include: reporteInclude,
  });
}

async function findMany({ where, skip, take }) {
  return prisma.reporte.findMany({
    where,
    skip,
    take,
    orderBy: [{ data_reporte: "desc" }, { id: "desc" }],
    include: reporteInclude,
  });
}

async function count(where) {
  return prisma.reporte.count({ where });
}

async function updateById(id, data) {
  return prisma.reporte.update({
    where: { id },
    data,
    include: reporteInclude,
  });
}

async function findStatusIaById(id) {
  return prisma.statusAnaliseIa.findUnique({
    where: { id },
  });
}

async function findStatusAdminById(id) {
  return prisma.statusAnaliseAdmin.findUnique({
    where: { id },
  });
}

async function findUsuarioById(id) {
  return prisma.usuario.findUnique({
    where: { id },
    select: { id: true },
  });
}

// Aliases de compatibilidade com implementacao anterior.
async function criar(dados) {
  return prisma.reporte.create({
    data: dados,
  });
}

async function buscarTodos() {
  return prisma.reporte.findMany({
    include: {
      usuario: {
        select: {
          nome: true,
          email: true,
        },
      },
    },
  });
}

module.exports = {
  createReporte,
  findById,
  findMany,
  count,
  updateById,
  findStatusIaById,
  findStatusAdminById,
  findUsuarioById,
  criar,
  buscarTodos,
};
