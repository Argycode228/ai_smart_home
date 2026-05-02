# Architecture

## Цель

Проект имитирует внутреннюю CRM/ERP operations-платформу: менеджеры видят очередь заявок, разработчики отслеживают приоритеты и SLA, аналитики выгружают данные для отчетности.

## Слои

```text
Browser UI
  ↓
src/app.js
  ↓
src/domain.js
  ↓
server/mock-api.js
```

## Frontend

`index.html` отвечает за структуру dashboard. `src/styles.css` содержит визуальную систему: sidebar, KPI cards, таблицу, panels, формы и адаптивность. `src/app.js` управляет состоянием страницы, событиями, фильтрами, рендерингом таблицы, CSV export, notification preview и audit trail.

Frontend не смешивает расчеты с разметкой. Все правила SLA, KPI, ролей и отчетов находятся в доменном слое.

## Domain Layer

`src/domain.js` содержит чистые функции:

- `calculateKpis` считает показатели по заявкам.
- `getSlaState` определяет состояние SLA.
- `rankRequestsByUrgency` сортирует очередь по риску и приоритету.
- `filterRequests` фильтрует заявки по запросу, статусу, владельцу и приоритету.
- `createNotificationPayload` формирует payload для email/SMS.
- `buildAuditEvent` создает событие для audit trail.
- `exportRequestsToCsv` готовит данные для выгрузки.

Такой слой легко тестировать и переносить в backend или shared package.

## Backend Mock API

`server/mock-api.js` использует только встроенные модули Node.js. Он отдает статические файлы и mock endpoint-ы:

- `GET /health`
- `GET /api/requests`
- `GET /api/kpis`
- `GET /api/reports/weekly`
- `POST /api/notifications`

Это не заменяет production backend, но показывает, как проект можно развивать в сторону NestJS/FastAPI.

## Quality

Тесты лежат в `tests/domain.test.js` и проверяют самые важные бизнес-правила: фильтрацию, KPI, SLA, сортировку, роли, уведомления, CSV и weekly report.

CI запускает `npm test` на GitHub Actions. Отдельный workflow публикует статическую версию в GitHub Pages.

## Production Notes

Для production-версии следующий шаг:

- хранить заявки в PostgreSQL;
- добавить Redis для кэширования KPI;
- вынести аудит в отдельную таблицу;
- закрыть API через JWT/RBAC;
- добавить OpenAPI spec;
- подключить observability: structured logs, metrics, traces.
