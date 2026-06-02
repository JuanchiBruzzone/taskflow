# ============================================================
# EP-03: Gestión de Tareas (Issues)
# US-05: Crear tarea
# US-06: Mover tarea entre columnas
# ============================================================

Feature: Gestión de tareas en el tablero
  Como miembro de un proyecto
  Quiero crear y mover tareas en el tablero
  Para hacer seguimiento del trabajo

  Background:
    Given el servidor de TaskFlow está disponible
    And la base de datos está limpia
    And existe un proyecto "Backend Tasks" con un miembro autenticado

  Scenario: Crear tarea con todos los campos
    When el miembro crea una tarea con:
      | title    | Implementar endpoint de login |
      | priority | high                          |
      | dueDate  | 2026-04-15                    |
    Then la respuesta tiene código de estado 201
    And la tarea aparece en la columna "To Do"
    And la tarea tiene prioridad "high"

  Scenario: Mover tarea a In Progress
    Given que existe la tarea "Fix login bug" en la columna "To Do"
    When el miembro mueve la tarea a la columna "In Progress"
    Then la respuesta tiene código de estado 200
    And la tarea aparece en la columna "In Progress"
    And el estado de la tarea es "in_progress"

  Scenario: Asignar tarea a un miembro del equipo
    Given que existe la tarea "Revisar PR #42" en la columna "In Review"
    And existe el miembro "dev@test.com" en el proyecto
    When el miembro asigna la tarea a "dev@test.com"
    Then la respuesta tiene código de estado 200
    And la tarea está asignada a "dev@test.com"

  Scenario: Crear tarea con prioridad inválida devuelve 400
    When el miembro crea una tarea con:
      | title    | Tarea mala |
      | priority | ULTRA      |
    Then la respuesta tiene código de estado 400

  Scenario: No se puede crear tarea sin título
    When el miembro crea una tarea con:
      | title    |               |
      | priority | medium        |
    Then la respuesta tiene código de estado 400
    And el cuerpo contiene "message" con valor "El título de la tarea es requerido"

  Scenario: Crear tarea sin token devuelve 401
    When un usuario sin token intenta crear una tarea con título "Tarea sin auth"
    Then la respuesta tiene código de estado 401

  Scenario: La tarea creada tiene status TODO
    When el miembro crea una tarea con:
      | title    | Tarea nueva |
      | priority | medium      |
    Then la respuesta tiene código de estado 201
    And el estado de la tarea es "todo"