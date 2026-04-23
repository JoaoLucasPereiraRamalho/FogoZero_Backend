const educativoService = require("../services/educativo.service");

async function createNoticia(req, res, next) {
  try {
    const noticia = await educativoService.createNoticia(
      req.body,
      req.user.userId,
    );
    return res.status(201).json({ noticia });
  } catch (error) {
    return next(error);
  }
}

async function listNoticias(req, res, next) {
  try {
    const result = await educativoService.listNoticias(req.query);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function getNoticiaById(req, res, next) {
  try {
    const noticia = await educativoService.getNoticiaById(req.params);
    return res.status(200).json({ noticia });
  } catch (error) {
    return next(error);
  }
}

async function updateNoticia(req, res, next) {
  try {
    const noticia = await educativoService.updateNoticia(req.params, req.body);
    return res.status(200).json({ noticia });
  } catch (error) {
    return next(error);
  }
}

async function deleteNoticia(req, res, next) {
  try {
    const result = await educativoService.deleteNoticia(req.params);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function createGlossario(req, res, next) {
  try {
    const glossario = await educativoService.createGlossario(req.body);
    return res.status(201).json({ glossario });
  } catch (error) {
    return next(error);
  }
}

async function listGlossario(req, res, next) {
  try {
    const result = await educativoService.listGlossario(req.query);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function getGlossarioById(req, res, next) {
  try {
    const glossario = await educativoService.getGlossarioById(req.params);
    return res.status(200).json({ glossario });
  } catch (error) {
    return next(error);
  }
}

async function getGlossarioByTermo(req, res, next) {
  try {
    const result = await educativoService.getGlossarioByTermo(req.params);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function updateGlossario(req, res, next) {
  try {
    const glossario = await educativoService.updateGlossario(
      req.params,
      req.body,
    );
    return res.status(200).json({ glossario });
  } catch (error) {
    return next(error);
  }
}

async function deleteGlossario(req, res, next) {
  try {
    const result = await educativoService.deleteGlossario(req.params);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createNoticia,
  listNoticias,
  getNoticiaById,
  updateNoticia,
  deleteNoticia,
  createGlossario,
  listGlossario,
  getGlossarioById,
  getGlossarioByTermo,
  updateGlossario,
  deleteGlossario,
};
