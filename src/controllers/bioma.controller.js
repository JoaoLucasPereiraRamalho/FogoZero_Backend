const biomaService = require("../services/bioma.service");

async function listBiomas(req, res, next) {
  try {
    const biomas = await biomaService.listBiomas();
    return res.status(200).json({ biomas });
  } catch (error) {
    return next(error);
  }
}

async function getBiomaById(req, res, next) {
  try {
    const bioma = await biomaService.getBiomaById(req.params);
    return res.status(200).json({ bioma });
  } catch (error) {
    return next(error);
  }
}

async function listRegistrosByBioma(req, res, next) {
  try {
    const result = await biomaService.listRegistrosByBioma(
      req.params,
      req.query,
    );
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listBiomas,
  getBiomaById,
  listRegistrosByBioma,
};
