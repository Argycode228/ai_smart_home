# CRM Operations Platform

Production-like портфолио-проект для позиции **Middle Software Developer / Full-Stack Developer**. Это не шаблонный todo-list, а маленькая CRM/ERP operations-панель с бизнес-логикой, SLA-контролем, ролями, audit trail, mock API, тестами и документацией.

## Что показывает проект

- Умение проектировать интерфейс для внутренних корпоративных систем: CRM, ERP, заявки, роли, отчеты.
- Разделение UI и доменной логики: расчеты KPI, SLA, приоритетов и уведомлений вынесены в `src/domain.js`.
- Практический backend-подход: Node.js mock API отдает health, requests, KPI, reports и notifications.
- Инженерную аккуратность: тесты, GitHub Actions, GitHub Pages deploy, API contract и архитектурная документация.
- Продуктовое мышление: в интерфейсе есть реальные рабочие сценарии для менеджера, разработчика и аналитика.

## Функциональность

- Dashboard с KPI: активные заявки, SLA risk, pipeline value, среднее время закрытия.
- Таблица заявок с поиском, фильтром по статусу и владельцу.
- SLA-ранжирование: просроченные и рискованные задачи поднимаются выше.
- Карточка выбранной заявки с ролями, владельцем и описанием.
- Генерация notification payload для email/SMS gateway.
- Audit trail для действий над заявками.
- CSV export для отчетности.
- Форма создания новой заявки.
- Mock API для локального full-stack запуска.

## Стек

- Frontend: HTML, CSS, JavaScript ES Modules
- Backend: Node.js built-in `http` server
- Tests: Node.js test runner
- CI/CD: GitHub Actions
- Deploy: GitHub Pages для статической версии

## Быстрый запуск

```bash
npm test
npm start
```

После запуска откройте:

```text
http://localhost:4173
```

Статическая версия также работает на GitHub Pages. При открытии через Pages интерфейс использует локальные демо-данные, а при запуске через `npm start` доступен mock API.

## Структура

```text
crm-ops-platform/
├── index.html
├── src/
│   ├── app.js
│   ├── domain.js
│   └── styles.css
├── server/
│   └── mock-api.js
├── tests/
│   └── domain.test.js
├── docs/
│   ├── API_CONTRACT.md
│   ├── ARCHITECTURE.md
│   └── ROADMAP.md
└── .github/workflows/
    ├── ci.yml
    └── pages.yml
```

## Почему это хороший GitHub-проект для работодателя

Работодатель видит не только красивый экран, но и инженерную дисциплину: отдельно протестированную бизнес-логику, понятные контракты API, воспроизводимый запуск, CI и документацию. По такому проекту удобно обсуждать реальные задачи: оптимизацию SQL/API, роли доступа, SLA, интеграции, fallback-логику, поддержку legacy и развитие CRM/ERP-модулей.

## Возможное развитие

- Заменить mock API на NestJS/FastAPI backend.
- Добавить PostgreSQL schema и миграции.
- Подключить JWT/RBAC middleware.
- Добавить Swagger/OpenAPI.
- Перенести frontend на React/Next.js при необходимости.
