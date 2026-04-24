const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ZodError } = require("zod");
const AppError = require("../utils/appError");
const prisma = require("../config/database");
const reporteRepository = require("../repositories/reporte.repository");
const {
  createReporteSchema,
  reporteIdParamSchema,
  usuarioIdParamSchema,
  adminReporteListQuerySchema,
  userReporteListQuerySchema,
  updateStatusAdminSchema,
  forwardReporteSchema,
  primeiroReporteSchema,
} = require("../dtos/reporte.dto");

function mapZodError(error) {
  return error.issues.map((issue) => ({
    campo: issue.path.join("."),
    mensagem: issue.message,
  }));
}

function throwValidationError(message, error) {
  throw new AppError(message, 400, mapZodError(error));
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("JWT_SECRET nao configurada no ambiente.", 500);
  }
  return secret;
}

function getBcryptRounds() {
  const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
  if (!Number.isInteger(rounds) || rounds < 6 || rounds > 14) {
    throw new AppError(
      "BCRYPT_ROUNDS invalido. Use um valor entre 6 e 14.",
      500,
    );
  }
  return rounds;
}

function signToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      tipo: String(user.tipo || "usuario").toLowerCase(),
    },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRATION || "24h" },
  );
}

function sanitizeUser(user) {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    telefone: user.telefone,
    tipo: user.tipo,
    id_regiao: user.id_regiao,
    data_cadastro: user.data_cadastro,
  };
}

function buildListWhere(query) {
  const where = {};

  if (query.usuario_id) {
    where.usuario_id = query.usuario_id;
  }

  if (query.id_status_analise_ia) {
    where.id_status_analise_ia = query.id_status_analise_ia;
  }

  if (query.id_status_analise_admin) {
    where.id_status_analise_admin = query.id_status_analise_admin;
  }

  return where;
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

function toPublicReporte(reporte) {
  return {
    id: reporte.id,
    usuario_id: reporte.usuario_id,
    assunto: reporte.assunto,
    latitude: reporte.latitude,
    longitude: reporte.longitude,
    imagem_url: reporte.imagem_url,
    id_status_analise_ia: reporte.id_status_analise_ia,
    id_status_analise_admin: reporte.id_status_analise_admin,
    data_reporte: reporte.data_reporte,
    usuario: reporte.usuario || null,
    status_analise_ia: reporte.status_analise_ia || null,
    status_analise_admin: reporte.status_analise_admin || null,
  };
}

async function validateStatusIds(data) {
  if (data.id_status_analise_ia) {
    const statusIa = await reporteRepository.findStatusIaById(
      data.id_status_analise_ia,
    );

    if (!statusIa) {
      throw new AppError("Status de analise IA nao encontrado.", 400);
    }
  }

  if (data.id_status_analise_admin) {
    const statusAdmin = await reporteRepository.findStatusAdminById(
      data.id_status_analise_admin,
    );

    if (!statusAdmin) {
      throw new AppError("Status de analise admin nao encontrado.", 400);
    }
  }
}

async function ensureUserExists(userId) {
  const usuario = await reporteRepository.findUsuarioById(userId);

  if (!usuario) {
    throw new AppError("Usuario nao encontrado.", 404);
  }
}

async function ensureReporteExists(reporteId) {
  const reporte = await reporteRepository.findById(reporteId);

  if (!reporte) {
    throw new AppError("Reporte nao encontrado.", 404);
  }

  return reporte;
}

async function ensureAdminStatusExists(statusId) {
  const statusAdmin = await reporteRepository.findStatusAdminById(statusId);

  if (!statusAdmin) {
    throw new AppError("Status de analise admin nao encontrado.", 400);
  }
}

async function listWithFilters(schema, query, extraWhere = {}) {
  const data = schema.parse(query);
  const where = {
    ...buildListWhere(data),
    ...extraWhere,
  };
  const skip = (data.page - 1) * data.limit;

  const [reportes, total] = await Promise.all([
    reporteRepository.findMany({ where, skip, take: data.limit }),
    reporteRepository.count(where),
  ]);

  return buildPaginationResponse(
    reportes.map(toPublicReporte),
    data.page,
    data.limit,
    total,
  );
}

async function create(input, authenticatedUserId) {
  try {
    if (!authenticatedUserId) {
      throw new AppError("Usuario nao autenticado.", 401);
    }

    const data = createReporteSchema.parse(input);

    await ensureUserExists(authenticatedUserId);
    await validateStatusIds(data);

    const reporte = await reporteRepository.createReporte({
      usuario_id: authenticatedUserId,
      assunto: data.assunto,
      latitude: data.latitude,
      longitude: data.longitude,
      imagem_url: data.imagem_url,
      id_status_analise_ia: data.id_status_analise_ia ?? 1,
      id_status_analise_admin: data.id_status_analise_admin ?? 1,
    });

    return toPublicReporte(reporte);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(
        "Dados de reporte invalidos.",
        400,
        mapZodError(error),
      );
    }

    throw error;
  }
}

async function listAll(query) {
  try {
    return listWithFilters(adminReporteListQuerySchema, query);
  } catch (error) {
    if (error instanceof ZodError) {
      throwValidationError("Filtros de listagem invalidos.", error);
    }

    throw error;
  }
}

async function listByUsuario(params, query, authenticatedUserId) {
  try {
    if (!authenticatedUserId) {
      throw new AppError("Usuario nao autenticado.", 401);
    }

    const { usuario_id } = usuarioIdParamSchema.parse(params);

    if (authenticatedUserId !== usuario_id) {
      throw new AppError("Acesso negado para este recurso.", 403);
    }

    await ensureUserExists(usuario_id);

    return listWithFilters(userReporteListQuerySchema, query, {
      usuario_id,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throwValidationError("Filtros de listagem invalidos.", error);
    }

    throw error;
  }
}

async function getById(params) {
  try {
    const { id } = reporteIdParamSchema.parse(params);

    const reporte = await ensureReporteExists(id);

    return toPublicReporte(reporte);
  } catch (error) {
    if (error instanceof ZodError) {
      throwValidationError("Identificador de reporte invalido.", error);
    }

    throw error;
  }
}

async function updateAdminStatus(params, input) {
  try {
    const { id } = reporteIdParamSchema.parse(params);
    const data = updateStatusAdminSchema.parse(input);

    await ensureReporteExists(id);
    await ensureAdminStatusExists(data.id_status_analise_admin);

    const updatedReporte = await reporteRepository.updateById(id, {
      id_status_analise_admin: data.id_status_analise_admin,
    });

    return toPublicReporte(updatedReporte);
  } catch (error) {
    if (error instanceof ZodError) {
      throwValidationError("Dados para atualizacao invalidos.", error);
    }

    throw error;
  }
}

async function forwardToFireDepartment(params, input) {
  try {
    const data = forwardReporteSchema.parse(input);
    const reporte = await updateAdminStatus(params, {
      id_status_analise_admin: data.id_status_analise_admin,
    });

    return {
      mensagem: "Reporte encaminhado para analise administrativa.",
      reporte,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      throwValidationError("Dados para encaminhamento invalidos.", error);
    }

    throw error;
  }
}

// Aliases de compatibilidade com implementacao anterior.
async function registrarNovoReporte(dados) {
  const reporteParaSalvar = {
    ...dados,
    id_status_analise_ia: dados.id_status_analise_ia ?? 1,
    id_status_analise_admin: dados.id_status_analise_admin ?? 1,
  };

  return reporteRepository.criar(reporteParaSalvar);
}

async function listarTodos() {
  return reporteRepository.buscarTodos();
}

async function registerAndCreateFirstReporte(input) {
  try {
    const data = primeiroReporteSchema.parse(input);
    const email = data.usuario.email.toLowerCase();

    const existingUser = await prisma.usuario.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError("Email ja cadastrado.", 409);
    }

    const senhaHash = await bcrypt.hash(data.usuario.senha, getBcryptRounds());

    const [createdUser, createdReporte] = await prisma.$transaction(
      async (tx) => {
        const usuario = await tx.usuario.create({
          data: {
            nome: data.usuario.nome,
            email,
            telefone: data.usuario.telefone,
            senha_hash: senhaHash,
            tipo: "usuario",
            id_regiao: data.usuario.id_regiao,
          },
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            tipo: true,
            id_regiao: true,
            data_cadastro: true,
          },
        });

        const reporte = await tx.reporte.create({
          data: {
            usuario_id: usuario.id,
            assunto: data.reporte.assunto,
            latitude: data.reporte.latitude,
            longitude: data.reporte.longitude,
            imagem_url: data.reporte.imagem_url,
            id_status_analise_ia: 1,
            id_status_analise_admin: 1,
          },
          include: {
            status_analise_ia: { select: { id: true, descricao: true } },
            status_analise_admin: { select: { id: true, descricao: true } },
          },
        });

        return [usuario, reporte];
      },
    );

    return {
      usuario: sanitizeUser(createdUser),
      token: signToken(createdUser),
      reporte: toPublicReporte(createdReporte),
    };
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(
        "Dados do primeiro reporte invalidos.",
        400,
        mapZodError(error),
      );
    }

    throw error;
  }
}

module.exports = {
  create,
  listAll,
  listByUsuario,
  getById,
  updateAdminStatus,
  forwardToFireDepartment,
  registrarNovoReporte,
  listarTodos,
  registerAndCreateFirstReporte,
};
