const { ZodError } = require("zod");
const AppError = require("../utils/appError");
const biomaRepository = require("../repositories/bioma.repository");
const {
  biomaIdParamSchema,
  registrosQuerySchema,
} = require("../dtos/bioma.dto");

function mapZodError(error) {
  return error.issues.map((issue) => ({
    campo: issue.path.join("."),
    mensagem: issue.message,
  }));
}

function buildDateWhere(data_inicio, data_fim) {
  if (!data_inicio && !data_fim) return {};

  const filter = {};
  if (data_inicio) filter.gte = data_inicio;
  if (data_fim) filter.lte = data_fim;

  return { data_registro: filter };
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

async function listBiomas() {
  const biomas = await biomaRepository.findAll();

  return biomas.map((b) => ({
    id: b.id,
    descricao: b.descricao,
    total_regioes: b._count.regioes,
  }));
}

async function getBiomaById(params) {
  try {
    const { id } = biomaIdParamSchema.parse(params);

    const bioma = await biomaRepository.findById(id);

    if (!bioma) {
      throw new AppError("Bioma nao encontrado.", 404);
    }

    return bioma;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Parametro invalido.", 400, mapZodError(error));
    }

    throw error;
  }
}

async function listRegistrosByBioma(params, query) {
  try {
    const { id } = biomaIdParamSchema.parse(params);
    const data = registrosQuerySchema.parse(query);

    const bioma = await biomaRepository.findById(id);
    if (!bioma) {
      throw new AppError("Bioma nao encontrado.", 404);
    }

    if (data.data_inicio && data.data_fim && data.data_inicio > data.data_fim) {
      throw new AppError("data_inicio nao pode ser posterior a data_fim.", 400);
    }

    const where = buildDateWhere(data.data_inicio, data.data_fim);
    const skip = (data.page - 1) * data.limit;

    const [registros, total] = await Promise.all([
      biomaRepository.findRegistrosByBiomaId({
        biomaId: id,
        skip,
        take: data.limit,
        where,
      }),
      biomaRepository.countRegistrosByBiomaId({ biomaId: id, where }),
    ]);

    return {
      bioma: { id: bioma.id, descricao: bioma.descricao },
      ...buildPaginationResponse(registros, data.page, data.limit, total),
    };
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(
        "Parametros de consulta invalidos.",
        400,
        mapZodError(error),
      );
    }

    throw error;
  }
}

module.exports = {
  listBiomas,
  getBiomaById,
  listRegistrosByBioma,
};
