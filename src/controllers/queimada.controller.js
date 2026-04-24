const QueimadaService = require("../services/queimada.service");
const { consultaQueimadaDTO } = require("../dtos/queimada.dto");

class QueimadaController {
  async consultar(req, res, next) {
    try {
      const filtrosValidados = consultaQueimadaDTO.parse(req.query);

      const dados = await QueimadaService.consultar(filtrosValidados);

      return res.status(200).json(dados);
    } catch (error) {
      next(error);
    }
  }

  async store(req, res, next) {
    try {
      const novo = await QueimadaService.registrarFocos(req.body);
      return res.status(201).json(novo);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new QueimadaController();
