"use strict";

process.env.JWT_SECRET = "test-secret-fogozero";
process.env.BCRYPT_ROUNDS = "6";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test_db"; // fictício — queries são mockadas

const { describe, it, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");

const usuarioRepository = require("../../src/repositories/usuario.repository");
const usuarioService = require("../../src/services/usuario.service");

const USUARIO_MOCK = {
  id: 5,
  nome: "Carlos Ferreira",
  email: "carlos@test.com",
  telefone: "31988887777",
  tipo: "usuario",
  id_regiao: 1,
  criado_em: new Date(),
};

const AUTH_USER_COMUM = { userId: 5, tipo: "usuario" };
const AUTH_USER_ADMIN = { userId: 1, tipo: "administrador" };

afterEach(() => {
  mock.restoreAll();
});

// ---------------------------------------------------------------------------
// getProfile
// ---------------------------------------------------------------------------
describe("usuarioService.getProfile", () => {
  it("deve lançar AppError 400 para id invalido (nao-numerico)", async () => {
    await assert.rejects(
      () => usuarioService.getProfile({ id: "abc" }),
      (err) => {
        assert.equal(err.statusCode, 400);
        return true;
      },
    );
  });

  it("deve lançar AppError 404 quando usuario nao encontrado", async () => {
    mock.method(usuarioRepository, "findById", async () => null);

    await assert.rejects(
      () => usuarioService.getProfile({ id: 999 }),
      (err) => {
        assert.equal(err.statusCode, 404);
        return true;
      },
    );
  });

  it("happy path: deve retornar usuario sem senha_hash", async () => {
    mock.method(usuarioRepository, "findById", async () => USUARIO_MOCK);

    const resultado = await usuarioService.getProfile({ id: "5" });

    assert.ok(resultado.usuario);
    assert.equal(resultado.usuario.id, 5);
    assert.equal("senha_hash" in resultado.usuario, false);
  });
});

// ---------------------------------------------------------------------------
// updateProfile
// ---------------------------------------------------------------------------
describe("usuarioService.updateProfile", () => {
  it("deve lançar AppError 404 quando usuario nao encontrado", async () => {
    mock.method(usuarioRepository, "findById", async () => null);

    await assert.rejects(
      () =>
        usuarioService.updateProfile(
          { id: 999 },
          { nome: "Novo Nome" },
          AUTH_USER_COMUM,
        ),
      (err) => {
        assert.equal(err.statusCode, 404);
        return true;
      },
    );
  });

  it("deve lançar AppError 400 quando nenhum campo enviado", async () => {
    mock.method(usuarioRepository, "findById", async () => USUARIO_MOCK);

    await assert.rejects(
      () => usuarioService.updateProfile({ id: 5 }, {}, AUTH_USER_COMUM),
      (err) => {
        assert.equal(err.statusCode, 400);
        return true;
      },
    );
  });

  it("happy path: usuario comum atualiza proprio perfil", async () => {
    mock.method(usuarioRepository, "findById", async () => USUARIO_MOCK);
    mock.method(usuarioRepository, "updateById", async (id, data) => ({
      ...USUARIO_MOCK,
      ...data,
    }));

    const resultado = await usuarioService.updateProfile(
      { id: 5 },
      { nome: "Carlos Atualizado" },
      AUTH_USER_COMUM,
    );

    assert.ok(resultado.usuario);
    assert.equal(resultado.usuario.nome, "Carlos Atualizado");
  });

  it("admin pode alterar campo tipo", async () => {
    mock.method(usuarioRepository, "findById", async () => USUARIO_MOCK);
    mock.method(usuarioRepository, "updateById", async (id, data) => ({
      ...USUARIO_MOCK,
      ...data,
    }));

    const resultado = await usuarioService.updateProfile(
      { id: 5 },
      { tipo: "administrador" },
      AUTH_USER_ADMIN,
    );

    assert.ok(resultado.usuario);
    assert.equal(resultado.usuario.tipo, "administrador");
  });

  it("usuario comum nao pode alterar campo tipo (Zod ignora o campo)", async () => {
    mock.method(usuarioRepository, "findById", async () => USUARIO_MOCK);
    mock.method(usuarioRepository, "updateById", async (id, data) => ({
      ...USUARIO_MOCK,
      ...data,
    }));

    const resultado = await usuarioService.updateProfile(
      { id: 5 },
      { nome: "Carlos", tipo: "administrador" },
      AUTH_USER_COMUM,
    );

    assert.ok(resultado.usuario);
    assert.equal(resultado.usuario.tipo, "usuario");
  });
});

// ---------------------------------------------------------------------------
// deleteAccount
// ---------------------------------------------------------------------------
describe("usuarioService.deleteAccount", () => {
  it("deve lançar AppError 404 quando usuario nao encontrado", async () => {
    mock.method(usuarioRepository, "findById", async () => null);

    await assert.rejects(
      () => usuarioService.deleteAccount({ id: 999 }),
      (err) => {
        assert.equal(err.statusCode, 404);
        return true;
      },
    );
  });

  it("happy path: deve retornar usuario deletado", async () => {
    mock.method(usuarioRepository, "findById", async () => USUARIO_MOCK);
    mock.method(usuarioRepository, "deleteById", async () => USUARIO_MOCK);

    const resultado = await usuarioService.deleteAccount({ id: 5 });

    assert.ok(resultado.usuario);
    assert.equal(resultado.usuario.id, 5);
  });

  it("deve lançar AppError 400 para id invalido", async () => {
    await assert.rejects(
      () => usuarioService.deleteAccount({ id: -1 }),
      (err) => {
        assert.equal(err.statusCode, 400);
        return true;
      },
    );
  });
});
