const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

// 1. Cria a conexão usando a variável de ambiente que o Prisma já carrega do .env
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// 2. Instancia o PrismaClient passando o adapter (Obrigatório no Prisma 7+)
const prisma = new PrismaClient({ adapter });
async function main() {
  console.log("🌱 Iniciando o seeder...");

  // 1. Cria um usuário padrão (para usarmos o ID dele ao criar reportes)
  const usuario = await prisma.usuario.upsert({
    where: { email: "admin@fogozero.mg.gov.br" },
    update: {},
    create: {
      nome: "Administrador FogoZero",
      email: "admin@fogozero.mg.gov.br",
      tipo: "ADMIN",
      senha_hash: "senha_falsa_para_teste_123", // <-- Adicione esta linha
    },
  });
  // 2. Cria tipos de região
  const tipoRegiao = await prisma.tipoRegiao.create({
    data: { descricao: "Município" },
  });

  // 3. Cria algumas regiões (Cidades de MG)
  const bh = await prisma.regiao.create({
    data: { nome: "Belo Horizonte", id_tipo_regiao: tipoRegiao.id },
  });

  const lavras = await prisma.regiao.create({
    data: { nome: "Lavras", id_tipo_regiao: tipoRegiao.id },
  });

  // 4. Cria registros de queimadas associados às regiões
  await prisma.registroQueimada.createMany({
    data: [
      {
        id_regiao: bh.id,
        data_registro: new Date("2026-04-10"),
        quantidade_focos: 15,
        fonte_dados: "INPE",
      },
      {
        id_regiao: bh.id,
        data_registro: new Date("2026-04-15"),
        quantidade_focos: 8,
        fonte_dados: "INPE",
      },
      {
        id_regiao: lavras.id,
        data_registro: new Date("2026-04-18"),
        quantidade_focos: 3,
        fonte_dados: "INPE",
      },
    ],
  });

  console.log("✅ Banco de dados populado com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
