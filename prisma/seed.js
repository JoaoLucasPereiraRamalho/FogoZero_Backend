/**
 * Seed principal — popula todas as tabelas necessárias:
 *   1. StatusAnaliseIa    (status da análise automática por IA)
 *   2. StatusAnaliseAdmin (status da revisão manual pelo administrador)
 *   3. TipoRegiao         (biomas)
 *   4. Regiao             (áreas de preservação por bioma)
 *   5. RegistroQueimada   (focos mensais por região — dados de 2022 a 2025)
 *   6. MunicipioMG        (importação do CSV dados_municipios.csv)
 *   7. Glossario          (termos técnicos do contexto ambiental/queimadas)
 *   8. Usuario            (usuário administrador padrão)
 *
 * Seguro para rodar múltiplas vezes: verifica existência antes de inserir.
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");
const bcrypt = require("bcryptjs");
const prisma = require("../src/config/database");

// ─── 1. Status de Análise ─────────────────────────────────────────────────

const STATUS_ANALISE_IA = [
  { id: 1, descricao: "Pendente (IA)" },
  { id: 2, descricao: "Incêndio Detectado" },
];

const STATUS_ANALISE_ADMIN = [
  { id: 1, descricao: "Aguardando Revisão Humana" },
];

// ─── 2. Usuário Admin ─────────────────────────────────────────────────────

const ADMIN_USER = {
  nome: "Administrador FogoZero",
  email: "admin@fogozero.mg.gov.br",
  telefone: "31999999999",
  tipo: "administrador",
  senha: "senha_falsa_para_teste_123",
};

// ─── 3. Biomas ─────────────────────────────────────────────────────────────

const BIOMAS = [
  { descricao: "Cerrado" },
  { descricao: "Mata Atlântica" },
  { descricao: "Caatinga" },
];

// ─── 4. Áreas de preservação por bioma ────────────────────────────────────

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

// ─── 5. Focos mensais por região ───────────────────────────────────────────
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

// ─── 6. Helpers CSV (MunicipioMG) ─────────────────────────────────────────

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
      "../src/data/dados_municipios.csv",
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

// ─── 7. Glossário ────────────────────────────────────────────────────────────

const GLOSSARIO = [
  {
    termo: "Foco de Incêndio",
    definicao:
      "Ponto detectado por satélite onde há emissão de calor compatível com queima de vegetação. Cada foco representa uma área ativa de queimada no momento da detecção.",
  },
  {
    termo: "Queimada",
    definicao:
      "Combustão de vegetação, seja de forma natural (raios) ou provocada pelo ser humano. Pode ser controlada, usada em práticas agrícolas, ou descontrolada, causando danos ambientais.",
  },
  {
    termo: "Bioma",
    definicao:
      "Grande região do planeta com características climáticas, vegetais e animais semelhantes. Em Minas Gerais predominam o Cerrado, a Mata Atlântica e a Caatinga.",
  },
  {
    termo: "Cerrado",
    definicao:
      "Bioma brasileiro de savana com grande biodiversidade, conhecido como 'berço das águas'. É o bioma mais afetado por queimadas em Minas Gerais, especialmente entre julho e outubro.",
  },
  {
    termo: "Mata Atlântica",
    definicao:
      "Um dos biomas mais ricos em biodiversidade do mundo, presente na faixa litorânea e serrana de Minas Gerais. Atualmente restam menos de 12% de sua cobertura original.",
  },
  {
    termo: "Caatinga",
    definicao:
      "Bioma exclusivamente brasileiro, caracterizado por vegetação adaptada à seca. No norte de Minas Gerais, sofre com períodos prolongados de estiagem que favorecem incêndios.",
  },
  {
    termo: "IMRI",
    definicao:
      "Índice Municipal de Risco de Incêndio. Valor calculado para cada município com base no histórico de focos, bioma predominante e fatores climáticos. Quanto maior o IMRI, maior o risco.",
  },
  {
    termo: "INPE",
    definicao:
      "Instituto Nacional de Pesquisas Espaciais. Órgão brasileiro responsável pelo monitoramento de queimadas por satélite e pela divulgação dos dados oficiais de focos de incêndio no país.",
  },
  {
    termo: "Área de Preservação",
    definicao:
      "Território legalmente protegido com restrições de uso para conservar a biodiversidade, recursos hídricos e ecossistemas. Exemplos: Parques Nacionais, APAs e Reservas Biológicas.",
  },
  {
    termo: "APA",
    definicao:
      "Área de Proteção Ambiental. Unidade de conservação de uso sustentável que permite a presença de populações humanas e atividades econômicas controladas, protegendo atributos naturais relevantes.",
  },
  {
    termo: "Mapa de Calor",
    definicao:
      "Visualização geográfica que representa a intensidade de focos de incêndio por região. Cores mais quentes (vermelho/laranja) indicam maior concentração de ocorrências.",
  },
  {
    termo: "Estação Seca",
    definicao:
      "Período do ano com baixa precipitação e umidade relativa do ar reduzida. No Brasil central, ocorre entre maio e outubro, sendo a época de maior risco de queimadas.",
  },
  {
    termo: "Reporte",
    definicao:
      "Registro de ocorrência enviado por um usuário da plataforma ao identificar um foco de incêndio ou queimada. Contribui para o monitoramento colaborativo e pode alertar autoridades.",
  },
  {
    termo: "Ranking Estadual",
    definicao:
      "Classificação dos municípios de Minas Gerais por número de focos de incêndio registrados. Indica quais localidades concentram maior atividade de queimadas no período analisado.",
  },
  {
    termo: "Variação no Período",
    definicao:
      "Diferença percentual no número de focos registrados em comparação ao período anterior. Valores positivos indicam aumento das ocorrências; valores negativos indicam redução.",
  },
  {
    termo: "Tendência",
    definicao:
      "Comportamento geral dos focos de incêndio ao longo do período analisado. Pode ser classificada como Crescimento (aumento), Queda (redução) ou Estável (sem variação significativa).",
  },
  {
    termo: "Monitoramento Ambiental",
    definicao:
      "Acompanhamento sistemático das condições do meio ambiente com uso de tecnologia. No FogoZero MG, inclui análise de focos por satélite, registros históricos e reportes da comunidade.",
  },
  {
    termo: "Fonte de Dados",
    definicao:
      "Origem das informações utilizadas na plataforma. Os dados de focos de incêndio provêm do sistema QUEIMADAS do INPE, atualizado diariamente com imagens de satélites.",
  },
  {
    termo: "Coordenadas Geográficas",
    definicao:
      "Par de valores (latitude e longitude) que determina com precisão a localização de um foco de incêndio no mapa. Essencial para direcionar equipes de combate ao local exato da ocorrência.",
  },
  {
    termo: "Classificação IMRI",
    definicao:
      "Categoria de risco atribuída a um município com base no valor do IMRI. As categorias são Baixo, Médio, Alto e Crítico, orientando a priorização de ações preventivas e de fiscalização ambiental.",
  },
  {
    termo: "Região de Preservação",
    definicao:
      "Área geográfica delimitada dentro de um bioma para fins de conservação, como parques estaduais e APAs. O monitoramento de focos por região permite identificar quais áreas protegidas estão mais vulneráveis.",
  },
  {
    termo: "Sazonalidade",
    definicao:
      "Padrão cíclico anual de variação no número de focos de incêndio. No Brasil central, agosto, setembro e outubro concentram o pico de ocorrências, enquanto os meses chuvosos (dezembro a março) registram os menores índices.",
  },
  {
    termo: "Estação Chuvosa",
    definicao:
      "Período com alta precipitação e umidade elevada, geralmente de novembro a março no Brasil central. A vegetação úmida reduz significativamente o risco de propagação de incêndios nessa época.",
  },
  {
    termo: "Prevenção de Incêndios",
    definicao:
      "Conjunto de ações que visam reduzir a ocorrência e o impacto de queimadas. Inclui educação ambiental, fiscalização de queimas ilegais, criação de aceiros e monitoramento contínuo por satélite.",
  },
  {
    termo: "Combate a Incêndios",
    definicao:
      "Operações de campo realizadas pelo Corpo de Bombeiros e brigadas ambientais para conter e extinguir focos ativos. Envolve técnicas como contra-fogo, abafamento e uso de aeronaves de combate.",
  },
  {
    termo: "Município",
    definicao:
      "Unidade territorial de Minas Gerais monitorada pela plataforma. Cada município possui dados de focos históricos, bioma predominante, mês de maior risco e índice IMRI calculado para orientar políticas de prevenção.",
  },
];

// ─── Runner principal ──────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Iniciando seed...\n");

  // 1. Status de Análise IA
  console.log("📍 [1/8] Inserindo status de análise IA...");
  for (const status of STATUS_ANALISE_IA) {
    await prisma.statusAnaliseIa.upsert({
      where: { id: status.id },
      update: {},
      create: status,
    });
  }
  console.log(`   ✅ ${STATUS_ANALISE_IA.length} status IA garantido(s)\n`);

  // 2. Status de Análise Admin
  console.log("📍 [2/8] Inserindo status de análise Admin...");
  for (const status of STATUS_ANALISE_ADMIN) {
    await prisma.statusAnaliseAdmin.upsert({
      where: { id: status.id },
      update: {},
      create: status,
    });
  }
  console.log(
    `   ✅ ${STATUS_ANALISE_ADMIN.length} status Admin garantido(s)\n`,
  );

  // 3. Biomas
  console.log("📍 [3/8] Inserindo biomas (tipo_regiao)...");
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

  // 4. Regiões (áreas de preservação)
  console.log("📍 [4/8] Inserindo regiões (áreas de preservação)...");
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

  // 5. Registros de queimada (focos mensais)
  console.log(
    "📍 [5/8] Inserindo registros de queimada (focos mensais 2022-2025)...",
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

  // 6. Municípios MG (CSV)
  console.log("📍 [6/8] Importando municípios do CSV...");
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

  // 7. Glossário
  console.log("📍 [7/8] Inserindo termos do glossário...");
  const termosExistentes = await prisma.glossario.findMany({
    select: { termo: true },
  });
  const termosExistentesSet = new Set(termosExistentes.map((t) => t.termo));
  const novosTermos = GLOSSARIO.filter(
    (t) => !termosExistentesSet.has(t.termo),
  );

  if (novosTermos.length > 0) {
    await prisma.glossario.createMany({ data: novosTermos });
  }
  console.log(
    `   ✅ ${novosTermos.length} termo(s) inserido(s) (${termosExistentes.length} já existiam)\n`,
  );

  // 8. Usuário administrador
  console.log("📍 [8/8] Inserindo usuário administrador...");
  const adminExistente = await prisma.usuario.findUnique({
    where: { email: ADMIN_USER.email },
  });

  if (adminExistente) {
    console.log(`   ⏭️  Administrador já existe — pulando.\n`);
  } else {
    const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
    const senhaHash = await bcrypt.hash(ADMIN_USER.senha, rounds);
    await prisma.usuario.create({
      data: {
        nome: ADMIN_USER.nome,
        email: ADMIN_USER.email,
        telefone: ADMIN_USER.telefone,
        tipo: ADMIN_USER.tipo,
        senha_hash: senhaHash,
      },
    });
    console.log(`   ✅ Usuário administrador criado\n`);
  }

  console.log("🎉 Seed concluído com sucesso!");
}

seed()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
