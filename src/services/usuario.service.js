const { ZodError } = require("zod");
const AppError = require("../utils/appError");
const usuarioRepository = require("../repositories/usuario.repository");
const { sanitizeUser } = require("../utils/authHelpers");
const {
  usuarioIdParamSchema,
  updateUsuarioSchema,
  adminUpdateUsuarioSchema,
  listUsuariosQuerySchema,
} = require("../dtos/usuario.dto");

function mapZodError(error) {
  return error.issues.map((issue) => ({
    campo: issue.path.join("."),
    mensagem: issue.message,
  }));
}

function buildPaginationResponse(items, page, limit, total) {
  return {
    dados: items,
    meta: {
      pagina: page,
      limite: limit,
      total,
      total_paginas: Math.ceil(total / limit),
    },
  };
}

async function ensureUsuarioExists(id) {
  const usuario = await usuarioRepository.findById(id);
  if (!usuario) {
    throw new AppError("Usuario nao encontrado.", 404);
  }
  return usuario;
}

async function getProfile(params) {
  try {
    const { id } = usuarioIdParamSchema.parse(params);
    const usuario = await ensureUsuarioExists(id);
    return { usuario: sanitizeUser(usuario) };
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(
        "Identificador de usuario invalido.",
        400,
        mapZodError(error),
      );
    }
    throw error;
  }
}

async function listAll(query) {
  try {
    const data = listUsuariosQuerySchema.parse(query);
    const skip = (data.page - 1) * data.limit;

    const [usuarios, total] = await Promise.all([
      usuarioRepository.findAll({ skip, take: data.limit }),
      usuarioRepository.count(),
    ]);

    return buildPaginationResponse(
      usuarios.map(sanitizeUser),
      data.page,
      data.limit,
      total,
    );
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(
        "Filtros de listagem invalidos.",
        400,
        mapZodError(error),
      );
    }
    throw error;
  }
}

async function updateProfile(params, input, authenticatedUser) {
  try {
    const { id } = usuarioIdParamSchema.parse(params);

    await ensureUsuarioExists(id);

    const isAdmin =
      String(authenticatedUser.tipo || "").toLowerCase() === "administrador";
    const schema = isAdmin ? adminUpdateUsuarioSchema : updateUsuarioSchema;
    const data = schema.parse(input);

    if (Object.keys(data).length === 0) {
      throw new AppError("Nenhum campo para atualizar.", 400);
    }

    const updated = await usuarioRepository.updateById(id, data);
    return { usuario: sanitizeUser(updated) };
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(
        "Dados de atualizacao invalidos.",
        400,
        mapZodError(error),
      );
    }
    throw error;
  }
}

async function deleteAccount(params) {
  try {
    const { id } = usuarioIdParamSchema.parse(params);

    await ensureUsuarioExists(id);

    const deleted = await usuarioRepository.deleteById(id);
    return { usuario: sanitizeUser(deleted) };
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(
        "Identificador de usuario invalido.",
        400,
        mapZodError(error),
      );
    }
    throw error;
  }
}

module.exports = {
  getProfile,
  listAll,
  updateProfile,
  deleteAccount,
};
