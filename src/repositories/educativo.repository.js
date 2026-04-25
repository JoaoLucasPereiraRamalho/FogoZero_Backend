const prisma = require("../config/database");

const noticiaInclude = {
  administrador: {
    select: {
      id: true,
      nome: true,
      email: true,
      tipo: true,
    },
  },
};

async function findUsuarioById(id) {
  return prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      email: true,
      tipo: true,
    },
  });
}

async function createNoticia(data) {
  return prisma.noticia.create({
    data,
    include: noticiaInclude,
  });
}

async function findNoticiaById(id) {
  return prisma.noticia.findUnique({
    where: { id },
    include: noticiaInclude,
  });
}

async function findManyNoticias({ where, skip, take }) {
  return prisma.noticia.findMany({
    where,
    skip,
    take,
    orderBy: [{ data_publicacao: "desc" }, { id: "desc" }],
    include: noticiaInclude,
  });
}

async function countNoticias(where) {
  return prisma.noticia.count({ where });
}

async function updateNoticiaById(id, data) {
  return prisma.noticia.update({
    where: { id },
    data,
    include: noticiaInclude,
  });
}

async function deleteNoticiaById(id) {
  return prisma.noticia.delete({
    where: { id },
    include: noticiaInclude,
  });
}

async function createGlossario(data) {
  return prisma.glossario.create({ data });
}

async function findGlossarioById(id) {
  return prisma.glossario.findUnique({ where: { id } });
}

async function findManyGlossario({ where, skip, take }) {
  return prisma.glossario.findMany({
    where,
    skip,
    take,
    orderBy: [{ termo: "asc" }, { id: "asc" }],
  });
}

async function countGlossario(where) {
  return prisma.glossario.count({ where });
}

async function findGlossarioByTermo(termo) {
  return prisma.glossario.findMany({
    where: {
      termo: {
        contains: termo,
        mode: "insensitive",
      },
    },
    orderBy: [{ termo: "asc" }, { id: "asc" }],
    take: 20,
  });
}

async function updateGlossarioById(id, data) {
  return prisma.glossario.update({
    where: { id },
    data,
  });
}

async function deleteGlossarioById(id) {
  return prisma.glossario.delete({
    where: { id },
  });
}

module.exports = {
  findUsuarioById,
  createNoticia,
  findNoticiaById,
  findManyNoticias,
  countNoticias,
  updateNoticiaById,
  deleteNoticiaById,
  createGlossario,
  findGlossarioById,
  findManyGlossario,
  countGlossario,
  findGlossarioByTermo,
  updateGlossarioById,
  deleteGlossarioById,
};
