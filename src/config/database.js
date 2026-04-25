const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL nao configurada no ambiente.");
}

const pool =
  global.__pgPool ||
  new Pool({
    connectionString,
  });

const adapter = new PrismaPg(pool);
const prisma = global.__prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  global.__pgPool = pool;
  global.__prisma = prisma;
}

module.exports = prisma;
