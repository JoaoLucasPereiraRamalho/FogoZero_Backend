const { ZodError } = require("zod");
const AppError = require("../utils/appError");
const educativoRepository = require("../repositories/educativo.repository");
const {
  noticiaIdParamSchema,
  glossarioIdParamSchema,
  termoParamSchema,
  createNoticiaSchema,
  updateNoticiaSchema,
  noticiaListQuerySchema,
  createGlossarioSchema,
  updateGlossarioSchema,
  glossarioListQuerySchema,
} = require("../dtos/educativo.dto");

function mapZodError(error) {
  return error.issues.map((issue) => ({
    campo: issue.path.join("."),
    mensagem: issue.message,
  }));
}

function throwValidationError(message, error) {
  throw new AppError(message, 400, mapZodError(error));
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

function toPublicNoticia(noticia) {
  return {
    id: noticia.id,
    titulo: noticia.titulo,
    link_origem: noticia.link_origem,
    img_destaque_url: noticia.img_destaque_url,
    adm_id: noticia.adm_id,
    data_publicacao: noticia.data_publicacao,
    administrador: noticia.administrador || null,
  };
}

function toPublicGlossario(item) {
  return {
    id: item.id,
    termo: item.termo,
    definicao: item.definicao,
  };
}

async function ensureUsuarioExists(usuarioId) {
  const usuario = await educativoRepository.findUsuarioById(usuarioId);

  if (!usuario) {
    throw new AppError("Administrador nao encontrado.", 404);
  }
}

async function ensureNoticiaExists(id) {
  const noticia = await educativoRepository.findNoticiaById(id);

  if (!noticia) {
    throw new AppError("Noticia nao encontrada.", 404);
  }

  return noticia;
}

async function ensureGlossarioExists(id) {
  const item = await educativoRepository.findGlossarioById(id);

  if (!item) {
    throw new AppError("Termo do glossario nao encontrado.", 404);
  }

  return item;
}

async function createNoticia(input, authenticatedAdminId) {
  try {
    if (!authenticatedAdminId) {
      throw new AppError("Usuario nao autenticado.", 401);
    }

    const data = createNoticiaSchema.parse(input);

    await ensureUsuarioExists(authenticatedAdminId);

    const noticia = await educativoRepository.createNoticia({
      ...data,
      adm_id: authenticatedAdminId,
    });
    return toPublicNoticia(noticia);
  } catch (error) {
    if (error instanceof ZodError) {
      throwValidationError("Dados de noticia invalidos.", error);
    }

    throw error;
  }
}

async function listNoticias(query) {
  try {
    const data = noticiaListQuerySchema.parse(query);
    const where = {};

    if (data.q) {
      where.OR = [
        {
          titulo: {
            contains: data.q,
            mode: "insensitive",
          },
        },
        {
          link_origem: {
            contains: data.q,
            mode: "insensitive",
          },
        },
      ];
    }

    const skip = (data.page - 1) * data.limit;

    const [noticias, total] = await Promise.all([
      educativoRepository.findManyNoticias({ where, skip, take: data.limit }),
      educativoRepository.countNoticias(where),
    ]);

    return buildPaginationResponse(
      noticias.map(toPublicNoticia),
      data.page,
      data.limit,
      total,
    );
  } catch (error) {
    if (error instanceof ZodError) {
      throwValidationError("Filtros de noticias invalidos.", error);
    }

    throw error;
  }
}

async function getNoticiaById(params) {
  try {
    const { id } = noticiaIdParamSchema.parse(params);
    const noticia = await ensureNoticiaExists(id);

    return toPublicNoticia(noticia);
  } catch (error) {
    if (error instanceof ZodError) {
      throwValidationError("Identificador de noticia invalido.", error);
    }

    throw error;
  }
}

async function updateNoticia(params, input) {
  try {
    const { id } = noticiaIdParamSchema.parse(params);
    const data = updateNoticiaSchema.parse(input);

    await ensureNoticiaExists(id);

    const noticia = await educativoRepository.updateNoticiaById(id, data);
    return toPublicNoticia(noticia);
  } catch (error) {
    if (error instanceof ZodError) {
      throwValidationError("Dados para atualizar noticia invalidos.", error);
    }

    throw error;
  }
}

async function deleteNoticia(params) {
  try {
    const { id } = noticiaIdParamSchema.parse(params);

    await ensureNoticiaExists(id);
    const deleted = await educativoRepository.deleteNoticiaById(id);

    return {
      mensagem: "Noticia removida com sucesso.",
      noticia: toPublicNoticia(deleted),
    };
  } catch (error) {
    if (error instanceof ZodError) {
      throwValidationError("Identificador de noticia invalido.", error);
    }

    throw error;
  }
}

async function createGlossario(input) {
  try {
    const data = createGlossarioSchema.parse(input);
    const item = await educativoRepository.createGlossario(data);

    return toPublicGlossario(item);
  } catch (error) {
    if (error instanceof ZodError) {
      throwValidationError("Dados do glossario invalidos.", error);
    }

    throw error;
  }
}

async function listGlossario(query) {
  try {
    const data = glossarioListQuerySchema.parse(query);
    const where = {};

    if (data.q) {
      where.OR = [
        {
          termo: {
            contains: data.q,
            mode: "insensitive",
          },
        },
        {
          definicao: {
            contains: data.q,
            mode: "insensitive",
          },
        },
      ];
    }

    const skip = (data.page - 1) * data.limit;

    const [itens, total] = await Promise.all([
      educativoRepository.findManyGlossario({ where, skip, take: data.limit }),
      educativoRepository.countGlossario(where),
    ]);

    return buildPaginationResponse(
      itens.map(toPublicGlossario),
      data.page,
      data.limit,
      total,
    );
  } catch (error) {
    if (error instanceof ZodError) {
      throwValidationError("Filtros de glossario invalidos.", error);
    }

    throw error;
  }
}

async function getGlossarioById(params) {
  try {
    const { id } = glossarioIdParamSchema.parse(params);
    const item = await ensureGlossarioExists(id);

    return toPublicGlossario(item);
  } catch (error) {
    if (error instanceof ZodError) {
      throwValidationError("Identificador de glossario invalido.", error);
    }

    throw error;
  }
}

async function getGlossarioByTermo(params) {
  try {
    const { termo } = termoParamSchema.parse(params);
    const itens = await educativoRepository.findGlossarioByTermo(termo);

    return {
      dados: itens.map(toPublicGlossario),
      meta: {
        total: itens.length,
      },
    };
  } catch (error) {
    if (error instanceof ZodError) {
      throwValidationError("Termo de busca invalido.", error);
    }

    throw error;
  }
}

async function updateGlossario(params, input) {
  try {
    const { id } = glossarioIdParamSchema.parse(params);
    const data = updateGlossarioSchema.parse(input);

    await ensureGlossarioExists(id);

    const item = await educativoRepository.updateGlossarioById(id, data);
    return toPublicGlossario(item);
  } catch (error) {
    if (error instanceof ZodError) {
      throwValidationError("Dados para atualizar glossario invalidos.", error);
    }

    throw error;
  }
}

async function deleteGlossario(params) {
  try {
    const { id } = glossarioIdParamSchema.parse(params);

    await ensureGlossarioExists(id);
    const deleted = await educativoRepository.deleteGlossarioById(id);

    return {
      mensagem: "Termo do glossario removido com sucesso.",
      glossario: toPublicGlossario(deleted),
    };
  } catch (error) {
    if (error instanceof ZodError) {
      throwValidationError("Identificador de glossario invalido.", error);
    }

    throw error;
  }
}

module.exports = {
  createNoticia,
  listNoticias,
  getNoticiaById,
  updateNoticia,
  deleteNoticia,
  createGlossario,
  listGlossario,
  getGlossarioById,
  getGlossarioByTermo,
  updateGlossario,
  deleteGlossario,
};
