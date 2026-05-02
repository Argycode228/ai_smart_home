# API Contract

Документ описывает mock API, которое можно заменить на NestJS, Express.js или FastAPI без изменения основных сценариев интерфейса.

## GET /health

Проверка доступности сервиса.

```json
{
  "status": "ok",
  "service": "crm-ops-platform",
  "timestamp": "2026-05-02T05:00:00.000Z"
}
```

## GET /api/requests

Возвращает список заявок.

Query params:

| Param | Example | Description |
| --- | --- | --- |
| `query` | `oauth` | Поиск по id, клиенту, модулю, владельцу, описанию и тегам |
| `status` | `in_progress` | `all`, `backlog`, `in_progress`, `review`, `blocked`, `closed` |
| `owner` | `Dana` | Фильтр по ответственному |

Response:

```json
{
  "data": [
    {
      "id": "REQ-2406",
      "customer": "Barys Fintech",
      "module": "API",
      "owner": "Aigerim",
      "priority": "critical",
      "status": "in_progress",
      "dueAt": "2026-05-02T12:00:00+05:00",
      "value": 1750000,
      "tags": ["oauth", "integration", "incident"]
    }
  ],
  "filters": {
    "query": "oauth",
    "status": "in_progress",
    "owner": "all"
  }
}
```

## GET /api/kpis

Возвращает агрегированные показатели.

```json
{
  "data": {
    "total": 8,
    "active": 6,
    "closed": 2,
    "blocked": 1,
    "slaRisk": 4,
    "breached": 1,
    "pipelineValue": 7300000,
    "averageResolutionHours": 30
  }
}
```

## GET /api/reports/weekly

Возвращает управленческий weekly report.

```json
{
  "data": {
    "generatedAt": "2026-05-02T05:00:00.000Z",
    "title": "Weekly CRM Operations Report",
    "lines": [
      "6 active requests from 8 total.",
      "4 requests require SLA attention, including 1 breached.",
      "2 requests are ready for review and 1 are blocked."
    ]
  }
}
```

## POST /api/notifications

Создает payload для внешнего email/SMS gateway.

Request:

```json
{
  "requestId": "REQ-2402",
  "channel": "sms"
}
```

Response:

```json
{
  "data": {
    "channel": "sms",
    "severity": "critical",
    "requestId": "REQ-2402",
    "customer": "Komek Retail",
    "recipientRole": "admin",
    "subject": "[CRITICAL] REQ-2402 CRM",
    "retryPolicy": {
      "maxAttempts": 5,
      "retryAfterMinutes": 5
    }
  }
}
```

## Error Shape

```json
{
  "error": "bad_request",
  "message": "Invalid JSON body."
}
```
