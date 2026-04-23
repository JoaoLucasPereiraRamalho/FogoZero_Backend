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

async function findByEmail(email) {
  return prisma.usuario.findUnique({
    where: { email },
    select: {
      ...usuarioPublicSelect,
      senha_hash: true,
    },
  });
}

async function createUsuario(data) {
  return prisma.usuario.create({
    data,
    select: usuarioPublicSelect,
  });
}

async function findById(id) {
  return prisma.usuario.findUnique({
    where: { id },
    select: {
      ...usuarioPublicSelect,
      senha_hash: true,
    },
  });
}

async function updatePasswordById(id, senha_hash) {
  return prisma.usuario.update({
    where: { id },
    data: { senha_hash },
    select: usuarioPublicSelect,
  });
}

module.exports = {
  findByEmail,
  createUsuario,
  findById,
  updatePasswordById,
};
