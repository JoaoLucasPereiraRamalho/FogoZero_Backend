"use strict";

// Variáveis de ambiente devem ser definidas antes de importar serviço/dependências
process.env.JWT_SECRET = "test-secret-fogozero";
process.env.BCRYPT_ROUNDS = "6";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test_db"; // fictício — queries são mockadas

const { describe, it, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");

// Importar o repositório ANTES do serviço para que mock.method funcione
const authRepository = require("../../src/repositories/auth.repository");
const authService = require("../../src/services/auth.service");

const BASE_USUARIO = {
  id: 1,
  nome: "Maria Testes",
  email: "maria@test.com",
  telefone: "31999990000",
  senha_hash: null,
  tipo: "usuario",
  id_regiao: 2,
};

afterEach(() => {
  mock.restoreAll();
});

// ---------------------------------------------------------------------------
// register
// ---------------------------------------------------------------------------
describe("authService.register", () => {
  it("deve lançar AppError 409 quando email ja cadastrado", async () => {
    mock.method(authRepository, "findByEmail", async () => BASE_USUARIO);

    await assert.rejects(
      () =>
        authService.register({
          nome: "Novo",
          email: "maria@test.com",
          telefone: "31999990001",
          senha: "senha123",
          id_regiao: 1,
        }),
      (err) => {
        assert.equal(err.statusCode, 409);
        return true;
      },
    );
  });

  it("deve lançar AppError 400 para dados Zod invalidos", async () => {
    mock.method(authRepository, "findByEmail", async () => null);

    await assert.rejects(
      () =>
        authService.register({
          nome: "A", // muito curto
          email: "nao-e-email",
          telefone: "12",
          senha: "123",
          id_regiao: -1,
        }),
      (err) => {
        assert.equal(err.statusCode, 400);
        return true;
      },
    );
  });

  it("happy path: deve retornar usuario e token", async () => {
    mock.method(authRepository, "findByEmail", async () => null);
    mock.method(authRepository, "createUsuario", async (data) => ({
      ...BASE_USUARIO,
      ...data,
      id: 99,
    }));

    const resultado = await authService.register({
      nome: "Maria Testes",
      email: "maria@test.com",
      telefone: "31999990000",
      senha: "senha123",
      id_regiao: 2,
    });

    assert.ok(resultado.usuario, "deve retornar usuario");
    assert.ok(resultado.token, "deve retornar token JWT");
    assert.equal(typeof resultado.token, "string");
    assert.equal("senha_hash" in resultado.usuario, false);
  });
});

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------
describe("authService.login", () => {
  it("deve lançar AppError 401 quando usuario nao encontrado", async () => {
    mock.method(authRepository, "findByEmail", async () => null);

    await assert.rejects(
      () => authService.login({ email: "naoexiste@test.com", senha: "abc123" }),
      (err) => {
        assert.equal(err.statusCode, 401);
        return true;
      },
    );
  });

  it("deve lançar AppError 401 quando senha incorreta", async () => {
    const bcrypt = require("bcryptjs");
    const hash = await bcrypt.hash("senhaCorreta", 4);
    mock.method(authRepository, "findByEmail", async () => ({
      ...BASE_USUARIO,
      senha_hash: hash,
    }));

    await assert.rejects(
      () =>
        authService.login({ email: "maria@test.com", senha: "senhaErrada" }),
      (err) => {
        assert.equal(err.statusCode, 401);
        return true;
      },
    );
  });

  it("happy path: deve retornar usuario e token com credenciais corretas", async () => {
    const bcrypt = require("bcryptjs");
    const hash = await bcrypt.hash("senha123", 4);
    mock.method(authRepository, "findByEmail", async () => ({
      ...BASE_USUARIO,
      senha_hash: hash,
    }));

    const resultado = await authService.login({
      email: "maria@test.com",
      senha: "senha123",
    });

    assert.ok(resultado.usuario);
    assert.ok(resultado.token);
    assert.equal("senha_hash" in resultado.usuario, false);
  });

  it("deve lançar AppError 400 para email invalido", async () => {
    await assert.rejects(
      () => authService.login({ email: "invalido", senha: "senha123" }),
      (err) => {
        assert.equal(err.statusCode, 400);
        return true;
      },
    );
  });
});

// ---------------------------------------------------------------------------
// logout
// ---------------------------------------------------------------------------
describe("authService.logout", () => {
  it("deve lançar AppError 401 quando usuario nao autenticado (sem userId)", async () => {
    await assert.rejects(
      () => authService.logout(null),
      (err) => {
        assert.equal(err.statusCode, 401);
        return true;
      },
    );
  });

  it("deve lançar AppError 401 quando userId ausente no objeto user", async () => {
    await assert.rejects(
      () => authService.logout({ tipo: "usuario" }),
      (err) => {
        assert.equal(err.statusCode, 401);
        return true;
      },
    );
  });

  it("happy path: deve retornar mensagem de sucesso", async () => {
    const resultado = await authService.logout({ userId: 1, email: "x@x.com" });
    assert.ok(resultado.mensagem);
    assert.equal(typeof resultado.mensagem, "string");
  });
});
