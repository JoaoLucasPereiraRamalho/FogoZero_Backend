const { ZodError } = require("zod");
const AppError = require("../utils/appError");
const reporteRepository = require("../repositories/reporte.repository");

//imports para o reconhecimento do microservice python
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

//imports para manipulação de arquivos temporários
const path = require("path");
const os = require("os");

const {
  createReporteSchema,
  reporteIdParamSchema,
  usuarioIdParamSchema,
  adminReporteListQuerySchema,
  userReporteListQuerySchema,
  updateStatusAdminSchema,
  forwardReporteSchema,
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

//função que baixa a imagem do reporte para um caminho temporário e retorna o caminho do arquivo salvo
async function baixarImagem(url) {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  const filePath = path.join(os.tmpdir(), `img_${Date.now()}.jpg`);
  const writer = fs.createWriteStream(filePath);

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(filePath));
    writer.on("error", reject);
  });
}

//função que chama o modelo de IA para analisar a imagem e retornar o resultado da analise
async function analisarImagemComIA(imagemPath) {
  const formData = new FormData();
  formData.append("file", fs.createReadStream(imagemPath));

  const response = await axios.post(
    "http://localhost:8000/predict",
    formData,
    { headers: formData.getHeaders() }
  );

  return response.data;
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

async function create(input) {
  try {
    const data = createReporteSchema.parse(input);

    await ensureUserExists(data.usuario_id);
    await validateStatusIds(data);

    let resultadoIA = null;

    if (data.imagem_url) {
      const imagemPath = await baixarImagem(data.imagem_url);

      resultadoIA = await analisarImagemComIA(imagemPath);

      //deleta o arquivo temporário após a análise para evitar acúmulo de arquivos no servidor
      fs.unlink(imagemPath, () => {});
    }

    let statusIA = 1; // padrão (sem incendio)

    if (resultadoIA && resultadoIA.resultado === "incendio") {
      statusIA = 2; // supondo que 2 = incendio detectado
    }


    const reporte = await reporteRepository.createReporte({
      usuario_id: data.usuario_id,
      assunto: data.assunto,
      latitude: data.latitude,
      longitude: data.longitude,
      imagem_url: data.imagem_url,
      id_status_analise_ia: statusIA,
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

async function listByUsuario(params, query) {
  try {
    const { usuario_id } = usuarioIdParamSchema.parse(params);

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

module.exports = {
  create,
  listAll,
  listByUsuario,
  getById,
  updateAdminStatus,
  forwardToFireDepartment,
  registrarNovoReporte,
  listarTodos,
};
