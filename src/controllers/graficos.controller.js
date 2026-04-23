const graficosService = require('../services/graficos.service');

class GraficosController {
  async buscarPorNome(req, res) {
    try {
      const { nome } = req.params;

      const assets = graficosService.buscarAssetsPorMunicipio(nome);

      return res.status(200).json(assets);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        erro: error.message || 'Erro ao buscar assets do município.',
      });
    }
  }
}

module.exports = new GraficosController();