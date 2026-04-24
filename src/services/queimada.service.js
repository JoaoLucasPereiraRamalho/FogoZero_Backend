const QueimadaRepository = require("../repositories/queimada.repository");
const RegiaoRepository = require("../repositories/regiao.repository"); // Necessário para pegar o nome da cidade
const alertaService = require("./alerta.service");

class QueimadaService {
  async consultar(filtros) {
    const registros = await QueimadaRepository.buscarPorFiltros(filtros);

    return registros;
  }

  /**
   * Registra novos focos e dispara a cadeia de notificações
   * @param {Object} dados - Contém id_regiao, quantidade_focos, fonte_dados, etc.
   */
  async registrarFocos(dados) {
    try {
      console.log(
        `🔥 [SERVICE] Iniciando registro de focos para região ID: ${dados.id_regiao}`,
      );

      // 1. Persistência: Salva o foco de incêndio no banco de dados
      const novoRegistro = await QueimadaRepository.criar({
        id_regiao: Number(dados.id_regiao),
        quantidade_focos: Number(dados.quantidade_focos),
        fonte_dados: dados.fonte_dados || "INPE",
        data_registro: dados.data_registro || new Date(),
      });

      const regiao = await RegiaoRepository.findById(dados.id_regiao);

      if (!regiao) {
        console.warn(
          `⚠️ Região ID ${dados.id_regiao} não encontrada. Alertas não serão disparados.`,
        );
        return novoRegistro;
      }

      if (novoRegistro.quantidade_focos > 0) {
        await alertaService.notificarQueimada(
          regiao.nome,
          novoRegistro.quantidade_focos,
          novoRegistro.fonte_dados,
          novoRegistro.data_registro,
        );
      }

      return novoRegistro;
    } catch (error) {
      console.error(
        "❌ Erro no QueimadaService.registrarFocos:",
        error.message,
      );
      throw error;
    }
  }
}

module.exports = new QueimadaService();
