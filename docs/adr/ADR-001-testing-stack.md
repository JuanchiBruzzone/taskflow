# ADR-001: Stack de Testing

**Estado:** Aceptado  
**Fecha:** 2026  
**Autores:** Equipo TaskFlow

---

## Contexto

TaskFlow utiliza React 18 + TypeScript + Vite en el frontend y Node.js + Express + TypeScript en el backend. El proyecto además cuenta con CI/CD en GitHub Actions y requiere que toda la suite de tests pueda ejecutarse con un único comando `npm run test`, de forma headless y sin configuración manual compleja.

En este contexto, necesitamos un stack de testing que se integre bien con TypeScript, que tenga baja fricción de configuración, que se ejecute rápido en desarrollo y CI/CD, y que permita cubrir las distintas capas del sistema: unit testing, integración/API y E2E web.

Si elegimos mal el stack, el equipo puede perder tiempo en configuración, mantener herramientas desconectadas entre sí o tener tests difíciles de correr, depurar o incorporar al pipeline.

---

## Decisión

Adoptamos el siguiente stack:

| Capa | Herramienta elegida | Alternativa descartada |
|------|---------------------|------------------------|
| Unit / Integration | **Vitest** | Jest |
| API Integration | **Supertest + Vitest** | Axios + servidor real |
| API Exploratorio / Reportes | **Postman + Newman** | — |
| E2E | **Playwright** | Cypress |

---

## Justificación

### Vitest sobre Jest
- Integración nativa con Vite (mismo ecosistema que el frontend)
- Ejecución más rápida, especialmente en modo watch
- API compatible con Jest → baja curva de aprendizaje
- Soporte nativo para TypeScript sin configuración adicional
- Mejor alineación con el stack moderno del proyecto

### Supertest + Vitest para API
- Permite testear endpoints directamente sobre la app Express sin levantar infraestructura externa
- Integración directa con Vitest → tests dentro del repo y cobertura medible
- Ideal para ejecutar en CI/CD en cada push
- Reduce complejidad comparado con usar clientes HTTP + servidor levantado

### Postman + Newman (complementario, no reemplazo)
- Permite explorar endpoints de forma visual
- Mantiene colecciones como documentación viva
- Genera reportes HTML/JSON para el equipo y el docente
- Soporta matriz de trazabilidad de requerimientos

👉 Se usa junto a Supertest, no en lugar de este

### Playwright sobre Cypress
- Soporte multi-browser real (Chromium, Firefox, WebKit)
- Soporte nativo para TypeScript
- Ejecución en modo headless ideal para CI/CD
- Debugging avanzado con Trace Viewer
- Locators más robustos y menos frágiles

---

## Consecuencias

**Positivas:**
- Stack coherente con TypeScript y JavaScript
- Buena integración con Vite, Node.js y CI/CD
- Tests rápidos y fáciles de ejecutar
- Cobertura completa: unit, integración, API y E2E
- Documentación viva y trazabilidad gracias a Postman

**Negativas:**
- Uso de múltiples herramientas → requiere entender bien el rol de cada una
- Vitest tiene menor ecosistema que Jest (aunque suficiente para el proyecto)
- Playwright requiere instalación de browsers en CI (mayor peso)

---

## Revisión

Esta decisión se revisará al final del semestre o si cambian significativamente los requerimientos del proyecto, el stack tecnológico o las necesidades del equipo.

---