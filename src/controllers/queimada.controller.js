const QueimadaService = require("../services/queimada.service");
const { consultaQueimadaDTO } = require("../dtos/queimada.dto");

class QueimadaController {
  async consultar(req, res, next) {
    try {
      // Valida os Query Params (?id_regiao=1...)
      const filtrosValidados = consultaQueimadaDTO.parse(req.query);

      // Busca os dados através do serviço
      const dados = await QueimadaService.consultar(filtrosValidados);

      return res.status(200).json(dados);
    } catch (error) {
      next(error); // Envia pro errorHandler global
    }
  }
}

module.exports = new QueimadaController();
