const bcrypt = require("bcryptjs");
const { ZodError } = require("zod");
const AppError = require("../utils/appError");
const prisma = require("../config/database");
const reporteRepository = require("../repositories/reporte.repository");
const alertaService = require("./alerta.service");
const {
  getBcryptRounds,
  signToken,
  sanitizeUser,
} = require("../utils/authHelpers");
const { formatarDataBR } = require("../utils/formatters");

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
    data_reporte: reporte.data_reporte
      ? formatarDataBR(reporte.data_reporte)
      : null,
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
  const iaServiceUrl = process.env.IA_SERVICE_URL;
  if (!iaServiceUrl) {
    throw new AppError("IA_SERVICE_URL nao configurada no ambiente.", 500);
  }

  const formData = new FormData();
  formData.append("file", fs.createReadStream(imagemPath));

  const response = await axios.post(`${iaServiceUrl}/predict`, formData, {
    headers: formData.getHeaders(),
  });

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

async function create(input, authenticatedUserId) {
  try {
    if (!authenticatedUserId) {
      throw new AppError("Usuario nao autenticado.", 401);
    }

    const data = createReporteSchema.parse(input);

    await ensureUserExists(authenticatedUserId);
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
      usuario_id: authenticatedUserId,
      assunto: data.assunto,
      latitude: data.latitude,
      longitude: data.longitude,
      imagem_url: data.imagem_url,
      id_status_analise_ia: statusIA,
      id_status_analise_admin: data.id_status_analise_admin ?? 1,
    });

    try {
      const cidade = encontrarCidadePorCoordenada(
        data.latitude,
        data.longitude,
      );
      if (cidade) {
        console.log(`📍 Cidade detectada para reporte: ${cidade}`);
        // Enviar alerta em background (não aguarda)
        alertaService
          .notificarReporte(cidade, data.assunto, reporte.id)
          .catch((err) => {
            console.error(
              `⚠️ Erro ao enviar alertas de reporte: ${err.message}`,
            );
          });
      }
    } catch (erroAlerta) {
      console.error(
        `⚠️ Erro ao processar alertas de reporte: ${erroAlerta.message}`,
      );
    }

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

async function listByUsuario(
  params,
  query,
  authenticatedUserId,
  isAdmin = false,
) {
  try {
    if (!authenticatedUserId) {
      throw new AppError("Usuario nao autenticado.", 401);
    }

    const { usuario_id } = usuarioIdParamSchema.parse(params);

    if (!isAdmin && authenticatedUserId !== usuario_id) {
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

async function registrarNovoReporte(dados) {
  const reporteParaSalvar = {
    ...dados,
    id_status_analise_ia: dados.id_status_analise_ia ?? 1,
    id_status_analise_admin: dados.id_status_analise_admin ?? 1,
  };
}

async function registerAndCreateFirstReporte(input) {
  try {
    const data = primeiroReporteSchema.parse(input);
    const email = data.usuario.email.toLowerCase();

    const existingUser = await prisma.usuario.findUnique({
      where: { email },
    });
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

function encontrarCidadePorCoordenada(latitude, longitude) {
  const cidadesCoord = [
    { nome: "Belo Horizonte", lat: -19.9167, lon: -43.9345, raio: 0.5 },
    { nome: "Brumadinho", lat: -20.1342, lon: -43.9286, raio: 0.3 },
    { nome: "Divinópolis", lat: -20.1484, lon: -44.8932, raio: 0.4 },
    { nome: "Governador Valadares", lat: -18.8583, lon: -41.9447, raio: 0.3 },
    { nome: "Montes Claros", lat: -16.7393, lon: -43.856, raio: 0.4 },
    { nome: "Juiz de Fora", lat: -21.7643, lon: -43.3569, raio: 0.3 },
    { nome: "Contagem", lat: -19.9297, lon: -44.0548, raio: 0.3 },
    { nome: "Betim", lat: -19.9789, lon: -44.1988, raio: 0.3 },
    { nome: "Uberlândia", lat: -18.9148, lon: -48.2742, raio: 0.5 },
    { nome: "Araxá", lat: -19.5868, lon: -46.9386, raio: 0.3 },
    { nome: "Itabira", lat: -19.6348, lon: -43.2278, raio: 0.3 },
    { nome: "Timóteo", lat: -19.4628, lon: -42.5861, raio: 0.3 },
    { nome: "Ipatinga", lat: -19.4671, lon: -42.4921, raio: 0.3 },
    { nome: "Caratinga", lat: -19.7883, lon: -41.6847, raio: 0.3 },
    { nome: "Ouro Preto", lat: -20.3842, lon: -43.5036, raio: 0.3 },
    { nome: "Mariana", lat: -20.2422, lon: -43.4189, raio: 0.3 },
    { nome: "Viçosa", lat: -20.7552, lon: -42.8622, raio: 0.3 },
    { nome: "Ponte Nova", lat: -20.3939, lon: -42.9126, raio: 0.3 },
    { nome: "Diamantina", lat: -18.2324, lon: -43.5932, raio: 0.3 },
    { nome: "Teófilo Otoni", lat: -17.8583, lon: -41.5069, raio: 0.3 },
    { nome: "Almenara", lat: -16.1835, lon: -40.6911, raio: 0.3 },
    { nome: "Araçuaí", lat: -16.8637, lon: -41.8067, raio: 0.3 },
  ];

  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  for (const cidade of cidadesCoord) {
    const deltaLat = Math.abs(lat - cidade.lat);
    const deltaLon = Math.abs(lon - cidade.lon);

    if (deltaLat <= cidade.raio && deltaLon <= cidade.raio) {
      return cidade.nome;
    }
  }

  return null;
}

module.exports = {
  create,
  listAll,
  listByUsuario,
  getById,
  updateAdminStatus,
  forwardToFireDepartment,
  registerAndCreateFirstReporte,
};
