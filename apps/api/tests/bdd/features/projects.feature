# ============================================================
# EP-02: Gestión de Proyectos
# US-03: Crear proyecto
# US-04: Aislamiento de proyectos por usuario
# ============================================================

Feature: Gestión de proyectos
  Como usuario autenticado de TaskFlow
  Quiero crear y listar proyectos
  Para organizar mi trabajo

  Background:
    Given la base de datos está limpia
    And existe un usuario registrado con email "owner@bdd.com" y password "BddPass1!"

  # ── US-03 ────────────────────────────────────────────────

  Scenario: Crear proyecto con nombre válido devuelve 201
    When el usuario autenticado crea un proyecto con nombre "BDD Project"
    Then la respuesta tiene status 201
    And la respuesta contiene el campo "id"
    And la respuesta contiene el campo "name" con valor "BDD Project"
    And la respuesta contiene el campo "ownerId" del usuario autenticado

  Scenario: Crear proyecto con nombre vacío devuelve 400
    When el usuario autenticado crea un proyecto con nombre ""
    Then la respuesta tiene status 400

  Scenario: Crear proyecto sin token devuelve 401
    When un usuario sin token intenta crear un proyecto con nombre "Proyecto Anónimo"
    Then la respuesta tiene status 401

  # ── US-04 ────────────────────────────────────────────────

  Scenario: Usuario 2 no ve proyectos de usuario 1
    Given el usuario autenticado crea un proyecto con nombre "Proyecto de User1"
    And existe un segundo usuario registrado con email "user2@bdd.com" y password "BddPass1!"
    When el segundo usuario lista sus proyectos
    Then la respuesta tiene status 200
    And la lista de proyectos no contiene "Proyecto de User1"
