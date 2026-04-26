<div align="center">
  <h1>🔥 FogoZero MG - API</h1>

  <p>
    <strong>Plataforma de Monitoramento e Combate a Incêndios Florestais em Minas Gerais</strong>
  </p>

  <p>
    <a href="#-sobre-o-projeto">Sobre</a> •
    <a href="#-funcionalidades">Funcionalidades</a> •
    <a href="#-arquitetura">Arquitetura</a> •
    <a href="#-tecnologias-utilizadas">Tecnologias</a> •
    <a href="#-instala%C3%A7%C3%A3o-e-execu%C3%A7%C3%A3o">Instalação</a> •
    <a href="#-documenta%C3%A7%C3%A3o-da-api">API</a> •
    <a href="#-deploy">Deploy</a>
  </p>

</div>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e Execução](#-instalação-e-execução)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Documentação da API](#-documentação-da-api)
- [Modelo de Dados](#-modelo-de-dados)
- [Deploy](#-deploy)
- [Licença](#-licença)

---

## 🎯 Sobre o Projeto

O **FogoZero MG** é uma API RESTful desenvolvida como parte do **Desafio III - ZettaLab 2025/2**. A plataforma tem como objetivo apoiar o **monitoramento, prevenção e combate a queimadas e incêndios florestais no estado de Minas Gerais**, integrando dados oficiais do INPE, análise de imagens por Inteligência Artificial e reportes da comunidade.

### Objetivos

- ✅ Permitir que cidadãos reportem focos de incêndio com geolocalização e imagem.
- ✅ Analisar automaticamente as imagens enviadas usando um modelo de IA (TensorFlow/Keras) para classificação de incêndios.
- ✅ Centralizar dados históricos de focos de queimada por município e bioma.
- ✅ Calcular o **IMRI** (Índice Municipal de Risco de Incêndio) para priorizar ações preventivas.
- ✅ Notificar usuários inscritos sobre ocorrências em cidades monitoradas.
- ✅ Disponibilizar conteúdo educativo (notícias e glossário ambiental).

---

## ✨ Funcionalidades

### 🔐 **Autenticação e Segurança**
- **Cadastro e Login** com hash de senha (bcrypt) e autenticação **JWT**.
- **Logout** com invalidação de token.
- **Recuperação de senha** via e-mail (SMTP).
- **Controle de acesso por papéis**: `usuário` e `administrador`.

### 📍 **Reportes Cidadãos**
- Registro de ocorrências com **assunto**, **latitude**, **longitude** e **imagem**.
- **Análise automática por IA**: a imagem é enviada ao microserviço Python (FastAPI + TensorFlow) que classifica como `incêndio` ou `não incêndio`.
- **Status duplo**: análise da IA + revisão administrativa.
- **Encaminhamento** de reportes pelo administrador (atualização de status).
- **Alertas em background** para usuários monitorando a cidade do reporte.

### 🗺️ **Monitoramento Geográfico**
- **Municípios MG**: listagem, ranking de focos, ranking IMRI, evolução histórica (2015–2025).
- **Biomas**: distribuição, registros por bioma (Cerrado, Mata Atlântica, Caatinga), evolução mensal.
- **Queimadas**: consulta e registro de focos por região de preservação.
- **Gráficos**: assets visuais por nome (heatmaps, mapas).

### 📚 **Conteúdo Educativo**
- **Notícias**: CRUD completo com fluxo de aprovação (`PENDENTE` / `APROVADA` / `REJEITADA`).
- **Crawler de notícias**: importação automática de fontes externas via RSS.
- **Glossário**: 26+ termos técnicos sobre queimadas, biomas e prevenção.

### 🔔 **Notificações e Monitoramento Pessoal**
- **Cadastro de cidades monitoradas** por usuário.
- **Notificações** automáticas (queimada, notícia, reporte) com flag de leitura.
- Listagem, contagem de não lidas, marcação em lote.

### 🤖 **Microserviço de IA**
- API FastAPI Python isolada para **análise de imagens** com modelo Keras (`reconhecimento_incendio.keras`).
- Comunicação com a API principal via HTTP (variável `IA_SERVICE_URL`).
- Containerizado e pronto para deploy independente.

---

## 🏢 Arquitetura

```
┌────────────────┐        ┌──────────────────┐        ┌────────────────┐
│   Frontend     │───────▶│   API Node.js    │───────▶│   PostgreSQL   │
│   (Vercel)     │  HTTP  │   (Render)       │  SQL   │   (Render)     │
└────────────────┘        └────────┬─────────┘        └────────────────┘
                                   │
                                   │ HTTP (multipart)
                                   ▼
                          ┌──────────────────┐
                          │ Microserviço IA  │
                          │ FastAPI + Keras  │
                          │   (Render)       │
                          └──────────────────┘
                                   │
                                   │ SMTP
                                   ▼
                          ┌──────────────────┐
                          │     Gmail        │
                          │  (Reset Senha)   │
                          └──────────────────┘
```

A aplicação segue arquitetura em **camadas**: `routes → controllers → services → repositories → prisma`, com DTOs validados via **Zod** e middleware global de tratamento de erros.

---

## 🔧 Tecnologias Utilizadas

### **Backend (API Principal)**
- **[Node.js 22](https://nodejs.org/)** - Runtime JavaScript.
- **[Express 5](https://expressjs.com/)** - Framework web.
- **[Prisma 7](https://www.prisma.io/)** + **[@prisma/adapter-pg](https://www.npmjs.com/package/@prisma/adapter-pg)** - ORM com adapter Postgres.
- **[PostgreSQL 16](https://www.postgresql.org/)** - Banco de dados relacional.
- **[Zod](https://zod.dev/)** - Validação de schemas e DTOs.
- **[JSON Web Token](https://jwt.io/)** - Autenticação stateless.
- **[bcryptjs](https://www.npmjs.com/package/bcryptjs)** - Hash de senhas.
- **[Nodemailer](https://nodemailer.com/)** - Envio de e-mails (SMTP).
- **[Multer](https://www.npmjs.com/package/multer)** - Upload de arquivos.
- **[csv-parse](https://csv.js.org/parse/)** - Importação de CSV de municípios.
- **[rss-parser](https://www.npmjs.com/package/rss-parser)** - Crawler de notícias.
- **[Swagger UI Express](https://www.npmjs.com/package/swagger-ui-express)** - Documentação interativa.

### **Microserviço de IA**
- **[Python 3.11](https://www.python.org/)**
- **[FastAPI](https://fastapi.tiangolo.com/)** - Framework web assíncrono.
- **[TensorFlow / Keras](https://www.tensorflow.org/)** - Inferência do modelo de classificação de incêndios.
- **[Pillow](https://python-pillow.org/)** - Processamento de imagens.
- **[Uvicorn](https://www.uvicorn.org/)** - Servidor ASGI.

### **Infraestrutura**
- **[Docker](https://www.docker.com/)** + **Docker Compose** - Containerização (multi-stage).
- **[Render](https://render.com/)** - Hospedagem (API + Banco + IA).
- **[Supabase Storage](https://supabase.com/)** - Armazenamento de imagens e assets de gráficos.

---

## 📦 Pré-requisitos

- **Node.js 22+** ([download](https://nodejs.org/))
- **PostgreSQL 16+** (local ou via Docker)
- **Python 3.11+** (apenas para o microserviço de IA)
- **Docker** e **Docker Compose** (opcional, para execução completa)
- **Git**

---

## 📥 Instalação e Execução

### **1. Clone o repositório**

```bash
git clone https://github.com/JoaoLucasPereiraRamalho/FogoZero_Backend.git
cd FogoZero_Backend
```

### **2. Configure as variáveis de ambiente**

```bash
cp .env.example .env
```

Edite o arquivo `.env` com seus valores reais (ver seção [Variáveis de Ambiente](#-variáveis-de-ambiente)).

### **3. Instale as dependências**

```bash
npm install
```

### **4. Configure o banco de dados**

```bash
# Aplica as migrations do Prisma
npx prisma migrate deploy

# Gera o Prisma Client
npx prisma generate

# Popula o banco com dados iniciais (status, biomas, regiões, glossário, admin etc.)
npm run db:seed
```

### **5. Suba o microserviço de IA**

Em outro terminal:

```bash
cd src/services
python -m venv .venv
.\.venv\Scripts\activate          # Windows
# source .venv/bin/activate       # Linux/Mac
pip install -r requirements.txt
python -m uvicorn aiservice:app --port 8000
```

### **6. Inicie a API**

Em outro terminal:

```bash
npm run dev
```

A API estará disponível em **`http://localhost:3000`** e a documentação Swagger em **`http://localhost:3000/api-docs`**.

---

### 🐳 Execução com Docker Compose

Para subir **API + Banco + Microserviço IA** de uma vez:

```bash
docker compose up --build
```

O Compose faz automaticamente:
1. Sobe o **PostgreSQL 16** com healthcheck.
2. Builda imagem do **microserviço Python** (`Dockerfile.ia`).
3. Builda a imagem da **API Node.js** (multi-stage).
4. Aplica as migrations, executa o seed e inicia o servidor.

---

## 🔑 Variáveis de Ambiente

Copie o `.env.example` e preencha:

```env
# Banco de dados
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=fogozero
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fogozero

# JWT
JWT_SECRET=<string_longa_aleatoria>
JWT_EXPIRATION=24h
BCRYPT_ROUNDS=10

# Aplicação
NODE_ENV=development
PORT=3000

# Supabase (storage de imagens e gráficos)
SUPABASE_URL=https://<seu-projeto>.supabase.co
SUPABASE_KEY=<chave_publica>

# Microserviço de IA
IA_SERVICE_URL=http://localhost:8000

# Frontend (link de reset de senha)
FRONTEND_URL=http://localhost:5173

# E-mail SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=<seu_email>
EMAIL_PASS=<senha_de_app>
```

---

## 📂 Estrutura do Projeto

```
FogoZero_Backend/
│
├── prisma/
│   ├── migrations/             # Migrations do banco
│   ├── schema.prisma           # Schema dos modelos
│   └── seed.js                 # Seed unificado (8 passos idempotentes)
│
├── src/
│   ├── config/                 # Configuração do Prisma + adapter Postgres
│   ├── controllers/            # Camada HTTP (1 por domínio)
│   ├── data/                   # CSV de municípios MG
│   ├── docs/                   # Documentação adicional
│   ├── dtos/                   # Schemas Zod de validação
│   ├── middlewares/            # auth, authorize, errorHandler
│   ├── repositories/           # Acesso a dados (Prisma)
│   ├── routes/                 # Definição de endpoints
│   ├── services/               # Regras de negócio + microserviço IA
│   │   ├── aiservice.py        # FastAPI + Keras (microserviço Python)
│   │   ├── reconhecimento_incendio.keras  # Modelo treinado
│   │   ├── requirements.txt
│   │   ├── Dockerfile.ia
│   │   └── *.service.js        # Services Node (auth, reporte, alerta etc.)
│   ├── utils/                  # appError, formatters, helpers
│   ├── server.js               # Entry point
│   ├── swagger.js              # Setup Swagger
│   └── database.js
│
├── tests/                      # Testes (node:test)
├── Dockerfile                  # API Node.js (multi-stage)
├── docker-compose.yml          # Orquestração completa
├── .env.example
└── package.json
```

---

## 🌐 Documentação da API

Quando a aplicação está rodando, a documentação interativa Swagger fica disponível em:

👉 **Local**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
👉 **Produção**: [https://fogozero-backend.onrender.com/api-docs](https://fogozero-backend.onrender.com/api-docs)

A rota raiz (`/`) redireciona automaticamente para o Swagger.

### Principais grupos de endpoints

| Prefixo | Descrição |
|---|---|
| `/api/auth` | Registro, login, logout, recuperação de senha |
| `/api/usuarios` | Perfil, atualização, exclusão, histórico de reportes |
| `/api/reportes` | CRUD de reportes + análise por IA + encaminhamento |
| `/api/queimadas` | Consulta e registro de focos por região |
| `/api/municipios` | Listagem, rankings, IMRI, evolução histórica |
| `/api/biomas` | Distribuição, evolução mensal, estatísticas |
| `/api/educativo` | CRUD de notícias e glossário |
| `/api/noticias` | Crawler/importação de notícias externas |
| `/api/monitoramentos` | Cadastro de cidades monitoradas |
| `/api/notificacoes` | Notificações do usuário |
| `/api/graficos` | Assets visuais (mapas e heatmaps) |
| `/ping` | Health check |

### Exemplos de Requisições (cURL)

#### **1. Cadastro de usuário**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@example.com",
    "telefone": "31999999999",
    "senha": "senha123"
  }'
```

#### **2. Login (obter token JWT)**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "senha": "senha123"
  }'
```

#### **3. Criar reporte (com análise por IA)**
*Requer Token Bearer no Header*
```bash
curl -X POST http://localhost:3000/api/reportes \
  -H "Authorization: Bearer <SEU_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "assunto": "Foco de incêndio próximo à serra",
    "latitude": -19.9167,
    "longitude": -43.9345,
    "imagem_url": "https://supabase.co/storage/.../foco.jpg"
  }'
```

---

## 📊 Modelo de Dados

O schema Prisma define **12 modelos** principais:

| Modelo | Descrição |
|---|---|
| `Usuario` | Usuários do sistema (cidadão e administrador) |
| `Reporte` | Ocorrências reportadas com geolocalização e análise dupla |
| `StatusAnaliseIa` | Status da análise automática (Pendente, Incêndio Detectado) |
| `StatusAnaliseAdmin` | Status da revisão humana (Aguardando Revisão Humana) |
| `Regiao` | Áreas de preservação (Serra do Cipó, Canastra etc.) |
| `TipoRegiao` | Biomas (Cerrado, Mata Atlântica, Caatinga) |
| `RegistroQueimada` | Focos mensais por região (2022–2025) |
| `MunicipioMG` | 853 municípios com IMRI, focos históricos e bioma |
| `Glossario` | Termos técnicos ambientais |
| `Noticia` | Notícias importadas com fluxo de aprovação |
| `Monitoramento` | Cidades monitoradas por usuário |
| `Notificacao` | Notificações enviadas aos usuários |

O schema completo está em [`prisma/schema.prisma`](prisma/schema.prisma).

---

## 🚀 Deploy

A plataforma está hospedada em produção:

| Serviço | URL |
|---|---|
| **Frontend** | [https://fogo-zero-mg.vercel.app](https://fogo-zero-mg.vercel.app) |
| **API Backend** | [https://fogozero-backend.onrender.com](https://fogozero-backend.onrender.com) |
| **Swagger** | [https://fogozero-backend.onrender.com/api-docs](https://fogozero-backend.onrender.com/api-docs) |
| **Microserviço IA** | Render (interno, acessado via `IA_SERVICE_URL`) |
| **Banco de Dados** | PostgreSQL 16 no Render |

### Configuração no Render

**API Node.js** (Web Service):
- Build: `npm install && npx prisma generate`
- Start: `npx prisma migrate deploy && node prisma/seed.js && node src/server.js`

**Microserviço IA** (Web Service Docker):
- Root Directory: `src/services`
- Dockerfile: `Dockerfile.ia`

**PostgreSQL**: Internal Database URL vinculada à variável `DATABASE_URL` da API.

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">
  <p>Projeto desenvolvido para o <strong>Desafio III - ZettaLab 2025/2</strong></p>
</div>
