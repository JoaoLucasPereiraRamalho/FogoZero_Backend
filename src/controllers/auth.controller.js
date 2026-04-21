const authService = require("../services/auth.service");

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res, next) {
  try {
    const result = await authService.logout(req.user);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const result = await authService.forgotPassword(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const result = await authService.resetPassword(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
};
