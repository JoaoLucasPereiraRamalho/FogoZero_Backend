const prisma = require("../config/database");

const usuarioPublicSelect = {
  id: true,
  nome: true,
  email: true,
  telefone: true,
  tipo: true,
  id_regiao: true,
  data_cadastro: true,
};

async function findById(id) {
  return prisma.usuario.findUnique({
    where: { id },
    select: usuarioPublicSelect,
  });
}

async function findAll({ skip, take }) {
  return prisma.usuario.findMany({
    skip,
    take,
    orderBy: { id: "asc" },
    select: usuarioPublicSelect,
  });
}

async function count() {
  return prisma.usuario.count();
}

async function updateById(id, data) {
  return prisma.usuario.update({
    where: { id },
    data,
    select: usuarioPublicSelect,
  });
}

async function deleteById(id) {
  return prisma.usuario.delete({
    where: { id },
    select: usuarioPublicSelect,
  });
}

module.exports = {
  findById,
  findAll,
  count,
  updateById,
  deleteById,
};
