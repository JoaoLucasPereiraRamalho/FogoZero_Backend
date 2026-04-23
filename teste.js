require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Testando conexão com o banco...');

  const total = await prisma.municipioMG.count();

  console.log('Conexão OK');
  console.log('Total de registros:', total);
}

main()
  .catch((error) => {
    console.error('Erro no teste:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });