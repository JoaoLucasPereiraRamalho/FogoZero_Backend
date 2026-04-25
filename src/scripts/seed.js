/**
 * Seed principal — popula todas as tabelas necessárias:
 *   1. TipoRegiao  (biomas)
 *   2. Regiao      (áreas de preservação por bioma)
 *   3. RegistroQueimada (focos mensais por região — dados de 2022 a 2025)
 *   4. MunicipioMG (importação do CSV dados_municipios.csv)
 *
 * Seguro para rodar múltiplas vezes: verifica existência antes de inserir.
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");
const prisma = require("../config/database");

// ─── 1. Biomas ─────────────────────────────────────────────────────────────

const BIOMAS = [
  { descricao: "Cerrado" },
  { descricao: "Mata Atlântica" },
  { descricao: "Caatinga" },
];

// ─── 2. Áreas de preservação por bioma ────────────────────────────────────

const REGIOES_POR_BIOMA = {
  Cerrado: [
    "Serra do Gandarela",
    "Serra do Cipó",
    "Serra da Canastra",
    "Grande Sertão Veredas",
  ],
  "Mata Atlântica": [
    "Serra da Mantiqueira",
    "Parque Estadual do Ibitipoca",
    "APA Sul RMBH",
  ],
  Caatinga: ["Parque Estadual da Lapa Grande", "APA Carste de Lagoa Santa"],
};

// ─── 3. Focos mensais por região ───────────────────────────────────────────
// Sazonalidade: pico na estação seca (jun–out), mínimo na chuvosa (nov–mar)
// multiplicador varia por bioma (Cerrado = maior, Caatinga = menor em MG)

const SAZONALIDADE = [
  // jan  fev  mar  abr  mai  jun  jul  ago  set  out  nov  dez
  0.15, 0.1, 0.08, 0.12, 0.3, 0.55, 0.8, 0.95, 1.0, 0.7, 0.25, 0.18,
];

const BASE_FOCOS_POR_BIOMA = {
  Cerrado: 320,
  "Mata Atlântica": 85,
  Caatinga: 110,
};

function gerarRegistros(regiaoId, biomaDescricao, baseAnual) {
  const registros = [];
  const anos = [2022, 2023, 2024, 2025];

  for (const ano of anos) {
    for (let mes = 0; mes < 12; mes++) {
      // Variação aleatória de ±20 % para tornar os dados mais realistas
      const variacao = 0.8 + Math.random() * 0.4;
      const focos = Math.round(SAZONALIDADE[mes] * baseAnual * variacao);

      registros.push({
        id_regiao: regiaoId,
        data_registro: new Date(ano, mes, 15),
        quantidade_focos: focos,
        fonte_dados: "INPE/QUEIMADAS",
      });
    }
  }

  return registros;
}

// ─── 4. Helpers CSV (MunicipioMG) ─────────────────────────────────────────

function toInt(v) {
  if (v === undefined || v === null || v === "") return null;
  return Number.parseInt(String(v).trim(), 10);
}

function toFloat(v) {
  if (v === undefined || v === null || v === "") return null;
  return Number.parseFloat(String(v).replace(",", ".").trim());
}

async function importarMunicipiosCSV() {
  return new Promise((resolve, reject) => {
    const caminhoArquivo = path.resolve(
      __dirname,
      "../data/dados_municipios.csv",
    );
    const registros = [];

    fs.createReadStream(caminhoArquivo)
      .pipe(
        parse({
          columns: true,
          delimiter: ",",
          trim: true,
          skip_empty_lines: true,
        }),
      )
      .on("data", (row) => {
        registros.push({
          municipio: row["Municipio"] || null,
          numero_focos: toInt(row["Numero_Focos"]),
          lat: toFloat(row["lat"]),
          lon: toFloat(row["lon"]),
          imri: toFloat(row["IMRI"]),
          classificacao_imri: row["Classificação_IMRI"] || null,
          bioma_mais_afetado: row["Bioma_Mais_Afetado"] || null,
          mes_mais_afetado: row["Mes_Mais_Afetado"] || null,
          focos_2015: toInt(row["Focos 2015"]),
          focos_2016: toInt(row["Focos 2016"]),
          focos_2017: toInt(row["Focos 2017"]),
          focos_2018: toInt(row["Focos 2018"]),
          focos_2019: toInt(row["Focos 2019"]),
          focos_2020: toInt(row["Focos 2020"]),
          focos_2021: toInt(row["Focos 2021"]),
          focos_2022: toInt(row["Focos 2022"]),
          focos_2023: toInt(row["Focos 2023"]),
          focos_2024: toInt(row["Focos 2024"]),
          focos_2025: toInt(row["Focos 2025"]),
        });
      })
      .on("end", () => resolve(registros))
      .on("error", reject);
  });
}

// ─── Runner principal ──────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Iniciando seed...\n");

  // 1. Biomas
  console.log("📍 [1/4] Inserindo biomas (tipo_regiao)...");
  const existentes = await prisma.tipoRegiao.findMany({
    select: { descricao: true },
  });
  const existentesSet = new Set(existentes.map((b) => b.descricao));
  const novosbiomas = BIOMAS.filter((b) => !existentesSet.has(b.descricao));

  if (novosbiomas.length > 0) {
    await prisma.tipoRegiao.createMany({ data: novosbiomas });
  }
  console.log(
    `   ✅ ${novosbiomas.length} bioma(s) inserido(s) (${existentes.length} já existiam)\n`,
  );

  // 2. Regiões (áreas de preservação)
  console.log("📍 [2/4] Inserindo regiões (áreas de preservação)...");
  const biomasNoBanco = await prisma.tipoRegiao.findMany();
  const biomaMap = Object.fromEntries(
    biomasNoBanco.map((b) => [b.descricao, b.id]),
  );

  const regioesExistentes = await prisma.regiao.findMany({
    select: { nome: true },
  });
  const regioesExistentesSet = new Set(regioesExistentes.map((r) => r.nome));

  let totalRegioesInseridas = 0;
  const regioesInseridas = {};

  for (const [biomaDesc, areas] of Object.entries(REGIOES_POR_BIOMA)) {
    const id_tipo_regiao = biomaMap[biomaDesc];
    if (!id_tipo_regiao) continue;

    regioesInseridas[biomaDesc] = [];

    for (const nome of areas) {
      if (!regioesExistentesSet.has(nome)) {
        const regiao = await prisma.regiao.create({
          data: { nome, id_tipo_regiao },
        });
        regioesInseridas[biomaDesc].push(regiao);
        totalRegioesInseridas++;
      }
    }
  }
  console.log(
    `   ✅ ${totalRegioesInseridas} região(ões) inserida(s) (${regioesExistentes.length} já existiam)\n`,
  );

  // 3. Registros de queimada (focos mensais)
  console.log(
    "📍 [3/4] Inserindo registros de queimada (focos mensais 2022-2025)...",
  );

  // Verifica se já há dados — se houver, pula para não duplicar
  const totalRegistros = await prisma.registroQueimada.count();

  if (totalRegistros > 0) {
    console.log(`   ⏭️  Já existem ${totalRegistros} registros — pulando.\n`);
  } else {
    // Busca todas as regiões (inclusive as que já existiam antes deste seed)
    const todasRegioes = await prisma.regiao.findMany({
      include: { tipo_regiao: true },
    });

    let totalFocosInseridos = 0;
    for (const regiao of todasRegioes) {
      const biomaDesc = regiao.tipo_regiao?.descricao;
      const base = BASE_FOCOS_POR_BIOMA[biomaDesc] ?? 100;
      const registros = gerarRegistros(regiao.id, biomaDesc, base);

      await prisma.registroQueimada.createMany({ data: registros });
      totalFocosInseridos += registros.length;
    }
    console.log(`   ✅ ${totalFocosInseridos} registros de focos inseridos\n`);
  }

  // 4. Municípios MG (CSV)
  console.log("📍 [4/4] Importando municípios do CSV...");
  const totalMunicipios = await prisma.municipioMG.count();

  if (totalMunicipios > 0) {
    console.log(`   ⏭️  Já existem ${totalMunicipios} municípios — pulando.\n`);
  } else {
    const registros = await importarMunicipiosCSV();
    let inseridos = 0;

    for (const item of registros) {
      if (!item.municipio) continue;
      await prisma.municipioMG.upsert({
        where: { municipio: item.municipio },
        update: item,
        create: item,
      });
      inseridos++;
    }
    console.log(`   ✅ ${inseridos} município(s) importado(s) do CSV\n`);
  }

  console.log("🎉 Seed concluído com sucesso!");
}

seed()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
