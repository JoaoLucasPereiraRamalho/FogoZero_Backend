const municipioService = require('../services/municipios.service');

class MunicipioController {

  async listar(req, res) {
    try {
      const { nome, bioma, classificacao } = req.query;

      let resultado;

      if (nome) {
        resultado = await municipioService.buscarPorNome(nome);
      } else if (bioma) {
        resultado = await municipioService.filtrarPorBioma(bioma);
      } else if (classificacao) {
        resultado = await municipioService.filtrarPorClassificacao(classificacao);
      } else {
        resultado = await municipioService.listarTodos();
      }

      return res.json(resultado);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar municípios' });
    }
  }

  async ranking(req, res) {
    try {
      const ranking = await municipioService.rankingFocos();
      return res.json(ranking);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao gerar ranking' });
    }
  }

}

module.exports = new MunicipioController();