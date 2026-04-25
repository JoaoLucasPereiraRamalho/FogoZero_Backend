-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "senha_hash" TEXT NOT NULL,
    "tipo" TEXT,
    "id_regiao" INTEGER,
    "data_cadastro" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reporte" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "assunto" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "imagem_url" TEXT,
    "id_status_analise_ia" INTEGER,
    "id_status_analise_admin" INTEGER,
    "data_reporte" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regiao" (
    "id" SERIAL NOT NULL,
    "nome" TEXT,
    "id_tipo_regiao" INTEGER,

    CONSTRAINT "regiao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registro_queimada" (
    "id" SERIAL NOT NULL,
    "id_regiao" INTEGER,
    "data_registro" TIMESTAMP(3),
    "quantidade_focos" INTEGER,
    "fonte_dados" TEXT,

    CONSTRAINT "registro_queimada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "noticia" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "link_origem" TEXT NOT NULL,
    "img_destaque_url" TEXT,
    "adm_id" INTEGER NOT NULL,
    "data_publicacao" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "noticia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "glossario" (
    "id" SERIAL NOT NULL,
    "termo" TEXT NOT NULL,
    "definicao" TEXT NOT NULL,

    CONSTRAINT "glossario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_analise_ia" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "status_analise_ia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_analise_admin" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "status_analise_admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipo_regiao" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "tipo_regiao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MunicipioMG" (
    "id" SERIAL NOT NULL,
    "municipio" TEXT NOT NULL,
    "numero_focos" INTEGER,
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,
    "imri" DOUBLE PRECISION,
    "classificacao_imri" TEXT,
    "bioma_mais_afetado" TEXT,
    "mes_mais_afetado" TEXT,
    "focos_2015" INTEGER,
    "focos_2016" INTEGER,
    "focos_2017" INTEGER,
    "focos_2018" INTEGER,
    "focos_2019" INTEGER,
    "focos_2020" INTEGER,
    "focos_2021" INTEGER,
    "focos_2022" INTEGER,
    "focos_2023" INTEGER,
    "focos_2024" INTEGER,
    "focos_2025" INTEGER,

    CONSTRAINT "MunicipioMG_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MunicipioMG_municipio_key" ON "MunicipioMG"("municipio");

-- AddForeignKey
ALTER TABLE "reporte" ADD CONSTRAINT "reporte_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporte" ADD CONSTRAINT "reporte_id_status_analise_ia_fkey" FOREIGN KEY ("id_status_analise_ia") REFERENCES "status_analise_ia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporte" ADD CONSTRAINT "reporte_id_status_analise_admin_fkey" FOREIGN KEY ("id_status_analise_admin") REFERENCES "status_analise_admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regiao" ADD CONSTRAINT "regiao_id_tipo_regiao_fkey" FOREIGN KEY ("id_tipo_regiao") REFERENCES "tipo_regiao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_queimada" ADD CONSTRAINT "registro_queimada_id_regiao_fkey" FOREIGN KEY ("id_regiao") REFERENCES "regiao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "noticia" ADD CONSTRAINT "noticia_adm_id_fkey" FOREIGN KEY ("adm_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
