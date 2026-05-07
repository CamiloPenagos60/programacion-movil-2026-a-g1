"# Matriz de Ejecución Dinámica - App Attendance

Este documento es el contrato de ejecución para el desarrollo del proyecto. Cada tarea debe cumplir con su Criterio de Aceptación (CA) y contar con una Evidencia técnica para ser marcada como `[x]`.

## 🟢 Fase 0: Diagnóstico y Estabilización
| Estado | Tarea | Criterio de Aceptación (CA) | Evidencia |
|---|---|---|---|
| [x] | Auditoría Técnica | Análisis completo de estructura, stack y madurez. | `Diagnóstico Técnico` entregado |
| [x] | Inventario de Activos | Mapeo de archivos, dependencias y Docker. | `ls -R` y análisis de `package.json` |
| [x] | Validación de Flujo | Confirmación de arranque Mongo -> Seed -> API -> App. | `docker-compose.yml` validado |

## 🔵 Fase 1: Estandarización y Calidad (DX)
| Estado | Tarea | Criterio de Aceptación (CA) | Evidencia |
|---|---|---|---|
| [x] | Configuración de Prettier | Formato consistente en todo el workspace. | `.prettierrc` en raíz |
| [x] | Linting Backend | Reglas de TS y Node aplicadas sin errores críticos. | `back/.eslintrc.json` |
| [x] | Linting Frontend | Reglas de React 19 y Hooks aplicadas. | `app/.eslintrc.json` |
| [x] | Orquestación de Calidad | Comandos `npm run lint` y `npm run format` funcionales. | `package.json` (raíz) |

## 🟡 Fase 2: Testing Base y Salud
| Estado | Tarea | Criterio de Aceptación (CA) | Evidencia |
|---|---|---|---|
| [x] | Framework de Testing | Vitest configurado en backend. | `back/vitest.config.ts` |
| [x] | Smoke Tests de Infra | `/health` y `/ready` retornan 200 y estado correcto. | `back/src/server.test.ts` |
| [x] | Orquestación de Tests | Comando `npm run test` ejecuta la suite de backend. | `package.json` (raíz) |

## 🟠 Fase 3: Datos y MongoDB (Refinamiento)
| Estado | Tarea | Criterio de Aceptación (CA) | Evidencia |
|---|---|---|---|
| [ ] | Validación de Seeds | Verificar que `initial-data.mongodb.js` sea idempotente. | Ejecución de `docker:up` repetida |
| [ ] | Auditoría de Índices | Verificar que las colecciones tengan índices de búsqueda. | `docs/db/data-model.md` vs DB real |
| [ ] | Validación de Tipos DB | Sincronizar modelos de Mongoose con `domain.ts` de la app. | `back/src/models/` |

## 🔴 Fase 4: Backend API (Core)
| Estado | Tarea | Criterio de Aceptación (CA) | Evidencia |
|---|---|---|---|
| [ ] | Contrato de API | Validar que todos los endpoints en `api-contract.md` existan. | `back/src/routes/` |
| [ ] | Flujo de Sesiones | Crear -> Activar -> Cerrar sesión funciona end-to-end. | Test de integración en Vitest |
| [ ] | Generación de QR | El token del QR es válido y tiene el TTL configurado. | `back/src/services/attendance.service.ts` |
| [ ] | Registro Público | El endpoint de asistencia pública valida el token y la persona. | `back/src/controllers/public-attendance.controller.ts` |

## 🟣 Fase 5: App Ionic React (Frontend)
| Estado | Tarea | Criterio de Aceptación (CA) | Evidencia |
|---|---|---|---|
| [ ] | Configuración Dinámica | La URL del backend se puede cambiar desde la UI. | `app/src/pages/BackendConfigPage.tsx` |
| [ ] | Flujo de Selección | Institución -> Unidad -> Persona es fluido y validado. | `app/src/pages/UnitSelectionPage.tsx` |
| [ ] | Gestión de Sesiones | La App puede crear y controlar el estado de la sesión. | `app/src/pages/SessionPage.tsx` |
| [ ] | Visualización de QR | El QR se renderiza correctamente y es escaneable. | `app/src/components/QRDisplay.tsx` |
| [ ] | Reportes de Asistencia | Los presentes/ausentes se actualizan en tiempo real. | `app/src/pages/ResultsPage.tsx` |

## ⚪ Fase 6: Madurez y Cierre
| Estado | Tarea | Criterio de Aceptación (CA) | Evidencia |
|---|---|---|---|
| [ ] | Validación Funcional | Checklist de `functional-checklist.md` completado al 100%. | `docs/validation/test-evidence.md` |
| [ ] | Documentación Agentic | Registro de todas las decisiones en `decision-log.md`. | `docs/agentic/decision-log.md` |
| [ ] | Build Capacitor | La app compila para Android sin errores de dependencias. | `npm run cap:sync` |"