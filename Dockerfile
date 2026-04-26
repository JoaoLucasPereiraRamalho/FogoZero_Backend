# ─────────────────────────────────────────────────────────────────
# Stage 1 — builder
# Instala TODAS as dependências e gera o Prisma Client
# ─────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copia somente os arquivos necessários para install + geração
COPY package*.json ./
COPY prisma ./prisma

# Instala todas as deps (incluindo devDeps para ter o CLI do Prisma)
RUN npm ci --no-fund --no-audit

# Gera o Prisma Client a partir do schema
RUN npx prisma generate


# ─────────────────────────────────────────────────────────────────
# Stage 2 — runner (imagem final, somente produção)
# ─────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

ENV NODE_ENV=production

# Cria usuário não-root (boa prática de segurança)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Garante ownership do WORKDIR vazio (operação barata, sem percorrer arquivos)
RUN chown appuser:appgroup /app

# Troca para usuário não-root ANTES de instalar dependências, assim
# tudo dentro de node_modules já nasce com o ownership correto
# (evita um RUN chown -R lento e que duplicaria a imagem).
USER appuser

# Instala apenas dependências de produção.
# --ignore-scripts evita que @prisma/client tente rodar "prisma generate"
# sem o CLI disponível; usamos o cliente já gerado do stage anterior.
COPY --chown=appuser:appgroup package*.json ./
RUN npm ci --omit=dev --ignore-scripts --no-fund --no-audit

# Copia o Prisma Client gerado no stage anterior
COPY --from=builder --chown=appuser:appgroup /app/node_modules/.prisma ./node_modules/.prisma

# CLI do Prisma copiado do builder para permitir execução de migrations
COPY --from=builder --chown=appuser:appgroup /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=appuser:appgroup /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

# Schema do Prisma e config do CLI (datasource.url, seed) são necessários em runtime
COPY --chown=appuser:appgroup prisma ./prisma
COPY --chown=appuser:appgroup prisma.config.ts ./

# Código-fonte da aplicação
COPY --chown=appuser:appgroup src ./src

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node src/server.js"]
