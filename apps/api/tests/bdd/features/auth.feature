# ============================================================
# EP-01: Autenticación
# US-01: Registro de usuario
# US-02: Login de usuario
# ============================================================

Feature: Autenticación de usuarios
  Como visitante de TaskFlow
  Quiero registrarme e iniciar sesión
  Para acceder a mis proyectos y tareas

  Background:
    Given la base de datos está limpia

  # ── US-01 ────────────────────────────────────────────────

  Scenario: Registro exitoso devuelve 201 y token
    When el usuario se registra con email "newuser@bdd.com" y password "Test1234!"
    Then la respuesta tiene status 201
    And la respuesta contiene el campo "token"
    And la respuesta contiene el campo "user"

  Scenario: Registro con email duplicado devuelve 409
    Given existe un usuario registrado con email "dup@bdd.com" y password "Test1234!"
    When el usuario se registra con email "dup@bdd.com" y password "Test1234!"
    Then la respuesta tiene status 409

  # ── US-02 ────────────────────────────────────────────────

  Scenario: Login con credenciales válidas devuelve 200 y token
    Given existe un usuario registrado con email "login@bdd.com" y password "Test1234!"
    When el usuario intenta iniciar sesión con email "login@bdd.com" y password "Test1234!"
    Then la respuesta tiene status 200
    And la respuesta contiene el campo "token"

  Scenario: Login con credenciales inválidas devuelve 401
    When el usuario intenta iniciar sesión con email "noexiste@bdd.com" y password "Wrong1234!"
    Then la respuesta tiene status 401
