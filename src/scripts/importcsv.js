//npm install csv-parse para ler arquivos csv
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const prisma = require('../config/database');

function toInt(value) {
  if (value === undefined || value === null || value === '') return null;
  return Number.parseInt(String(value).trim(), 10);
}

function toFloat(value) {
  if (value === undefined || value === null || value === '') return null;
  return Number.parseFloat(String(value).replace(',', '.').trim());
}

async function importarMunicipios() {
  const caminhoArquivo = path.resolve(__dirname, '../data/dados_municipios.csv');
  const registros = [];

  fs.createReadStream(caminhoArquivo)
    .pipe(
      parse({
        columns: true,
        delimiter: ',',
        trim: true,
        skip_empty_lines: true,
      })
    )
    .on('data', (row) => {
      registros.push({
        municipio: row['Municipio'] || null,
        numero_focos: toInt(row['Numero_Focos']),
        lat: toFloat(row['lat']),
        lon: toFloat(row['lon']),
        imri: toFloat(row['IMRI']),
        classificacao_imri: row['Classificação_IMRI'] || null,
        bioma_mais_afetado: row['Bioma_Mais_Afetado'] || null,
        mes_mais_afetado: row['Mes_Mais_Afetado'] || null,
        focos_2015: toInt(row['Focos 2015']),
        focos_2016: toInt(row['Focos 2016']),
        focos_2017: toInt(row['Focos 2017']),
        focos_2018: toInt(row['Focos 2018']),
        focos_2019: toInt(row['Focos 2019']),
        focos_2020: toInt(row['Focos 2020']),
        focos_2021: toInt(row['Focos 2021']),
        focos_2022: toInt(row['Focos 2022']),
        focos_2023: toInt(row['Focos 2023']),
        focos_2024: toInt(row['Focos 2024']),
        focos_2025: toInt(row['Focos 2025']),
      });
    })
    .on('end', async () => {
      try {
        for (const item of registros) {
          if (!item.municipio) continue;

          await prisma.municipioMG.upsert({
            where: { municipio: item.municipio },
            update: item,
            create: item,
          });
        }

        console.log('Importação concluída com sucesso.');
        console.log(`Total processado: ${registros.length}`);
      } catch (error) {
        console.error('Erro ao importar municípios:', error);
      } finally {
        await prisma.$disconnect();
      }
    })
    .on('error', async (error) => {
      console.error('Erro ao ler o CSV:', error);
      await prisma.$disconnect();
    });
}

importarMunicipios();