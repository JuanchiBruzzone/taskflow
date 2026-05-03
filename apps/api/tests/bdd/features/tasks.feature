# ============================================================
# EP-03: Gestión de Tareas
# US-05: Crear tarea con prioridad
# ============================================================

Feature: Gestión de tareas
  Como miembro de un proyecto
  Quiero crear tareas con prioridad
  Para organizar el trabajo del equipo

  Background:
    Given la base de datos está limpia
    And existe un usuario registrado con email "taskuser@bdd.com" y password "BddPass1!"
    And el usuario autenticado tiene un proyecto llamado "Proyecto de Tareas"

  # ── US-05 ────────────────────────────────────────────────

  Scenario: Crear tarea con prioridad válida HIGH devuelve 201
    When el usuario autenticado crea una tarea con título "Implementar login" y prioridad "HIGH"
    Then la respuesta tiene status 201
    And la respuesta contiene el campo "id"
    And la respuesta contiene el campo "priority" con valor "HIGH"

  Scenario: Crear tarea con prioridad inválida devuelve 400
    When el usuario autenticado crea una tarea con título "Tarea mala" y prioridad "ULTRA"
    Then la respuesta tiene status 400
