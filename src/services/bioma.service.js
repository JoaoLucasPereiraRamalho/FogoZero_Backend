const { ZodError } = require("zod");
const AppError = require("../utils/appError");
const biomaRepository = require("../repositories/bioma.repository");
const {
  biomaIdParamSchema,
  registrosQuerySchema,
  anoQuerySchema,
} = require("../dtos/bioma.dto");

const MESES_NOMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const MESES_ABREV = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

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

function calcularTendencia(porMes) {
  const focos = porMes.map((m) => m.total_focos);
  const metade = Math.floor(focos.length / 2);
  const primeira = focos.slice(0, metade).reduce((a, b) => a + b, 0);
  const segunda = focos.slice(metade).reduce((a, b) => a + b, 0);

  if (primeira === 0 && segunda === 0) return "estavel";
  if (primeira === 0) return "crescimento";

  const diff = ((segunda - primeira) / primeira) * 100;
  if (diff > 5) return "crescimento";
  if (diff < -5) return "queda";
  return "estavel";
}

async function getDistribuicao(query) {
  try {
    const { ano = new Date().getFullYear() } = anoQuerySchema.parse(query);

    const biomas = await biomaRepository.findAll();

    const resultados = await Promise.all(
      biomas.map(async (b) => {
        const [totalAtual, totalAnterior] = await Promise.all([
          biomaRepository.sumFocosAnuaisByBiomaId({ biomaId: b.id, ano }),
          biomaRepository.sumFocosAnuaisByBiomaId({
            biomaId: b.id,
            ano: ano - 1,
          }),
        ]);
        return { id: b.id, descricao: b.descricao, totalAtual, totalAnterior };
      }),
    );

    const totalGeral = resultados.reduce((acc, b) => acc + b.totalAtual, 0);

    return {
      ano,
      total_geral: totalGeral,
      biomas: resultados.map((b) => ({
        id: b.id,
        descricao: b.descricao,
        total_focos: b.totalAtual,
        percentual:
          totalGeral > 0
            ? Number(((b.totalAtual / totalGeral) * 100).toFixed(1))
            : 0,
        variacao_percentual:
          b.totalAnterior > 0
            ? Number(
                (
                  ((b.totalAtual - b.totalAnterior) / b.totalAnterior) *
                  100
                ).toFixed(1),
              )
            : null,
      })),
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

async function getEvolucaoMensal(params, query) {
  try {
    const { id } = biomaIdParamSchema.parse(params);
    const { ano = new Date().getFullYear() } = anoQuerySchema.parse(query);

    const bioma = await biomaRepository.findById(id);
    if (!bioma) throw new AppError("Bioma nao encontrado.", 404);

    const registros = await biomaRepository.findRegistrosMensaisByBiomaId({
      biomaId: id,
      ano,
    });

    const porMes = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      mes_nome: MESES_ABREV[i],
      total_focos: 0,
    }));

    for (const r of registros) {
      const mes = new Date(r.data_registro).getMonth();
      porMes[mes].total_focos += r.quantidade_focos ?? 0;
    }

    return {
      bioma: { id: bioma.id, descricao: bioma.descricao },
      ano,
      evolucao: porMes,
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

async function getEstatisticas(params, query) {
  try {
    const { id } = biomaIdParamSchema.parse(params);
    const { ano = new Date().getFullYear() } = anoQuerySchema.parse(query);

    const bioma = await biomaRepository.findById(id);
    if (!bioma) throw new AppError("Bioma nao encontrado.", 404);

    const registros = await biomaRepository.findRegistrosMensaisByBiomaId({
      biomaId: id,
      ano,
    });

    const porMes = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      mes_nome: MESES_NOMES[i],
      total_focos: 0,
    }));

    for (const r of registros) {
      const mes = new Date(r.data_registro).getMonth();
      porMes[mes].total_focos += r.quantidade_focos ?? 0;
    }

    const comDados = porMes.filter((m) => m.total_focos > 0);

    if (comDados.length === 0) {
      return {
        bioma: { id: bioma.id, descricao: bioma.descricao },
        ano,
        maior_registro: null,
        menor_registro: null,
        tendencia: null,
      };
    }

    const maior = comDados.reduce((a, b) =>
      b.total_focos > a.total_focos ? b : a,
    );
    const menor = comDados.reduce((a, b) =>
      b.total_focos < a.total_focos ? b : a,
    );
    const tendencia = calcularTendencia(porMes);

    return {
      bioma: { id: bioma.id, descricao: bioma.descricao },
      ano,
      maior_registro: { mes: maior.mes_nome, total_focos: maior.total_focos },
      menor_registro: { mes: menor.mes_nome, total_focos: menor.total_focos },
      tendencia,
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
  getDistribuicao,
  getEvolucaoMensal,
  getEstatisticas,
};
