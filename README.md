# Smart Home AI Assistant

Готовый статический сайт для проекта по теме AI + IoT.

## Что есть в проекте
- AI image section через Pollinations без API-ключа
- аналитический текст
- AI weather agent через Open-Meteo
- динамическая таблица датчиков
- AI avatar / speech section
- AI video section
- AI audio section
- чат-бот
- заключение и список инструментов

## Деплой на Vercel
1. В Vercel нажмите `Add New -> Project` и выберите репозиторий.
2. В настройках проекта выберите `Framework Preset: Other`.
3. Оставьте `Build Command` пустым.
4. Укажите `Output Directory: .`, если Vercel попросит директорию вывода.
5. Нажмите `Deploy`.

Картинки работают через Pollinations напрямую из браузера, поэтому для генерации изображений `OPENAI_API_KEY` не нужен.

## Если нужны остальные AI-функции
Для чат-бота, AI-аудио и AI-видео через OpenAI добавьте в Vercel `Settings -> Environment Variables`:

```text
OPENAI_API_KEY
```

Дополнительные переменные можно не задавать:
- `OPENAI_TEXT_MODEL` — модель для чат-бота, по умолчанию `gpt-4o-mini`.
- `OPENAI_TTS_MODEL` — модель озвучки, по умолчанию `gpt-4o-mini-tts`.
- `OPENAI_TTS_VOICE` — голос озвучки, по умолчанию `alloy`.
- `OPENAI_VIDEO_MODEL` — модель видео, по умолчанию `sora-2`.
- `OPENAI_VIDEO_SECONDS` — длина видео, по умолчанию `4`.
- `OPENAI_VIDEO_SIZE` — размер видео, по умолчанию `1280x720`.

Видео через Sora может требовать доступа к Video API и платного лимита OpenAI. Если видео недоступно, сайт покажет анимированный fallback-аватар.
