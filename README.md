# Smart Home AI Assistant

Готовый статический сайт для проекта по теме AI + IoT.

## Что есть в проекте
- AI image section
- аналитический текст
- AI weather agent через Open-Meteo
- динамическая таблица датчиков
- AI avatar / speech section
- AI video section
- AI audio section
- чат-бот
- заключение и список инструментов

## Быстрый деплой на GitHub Pages
1. Создайте новый репозиторий на GitHub.
2. Загрузите в него все файлы из этой папки.
3. В GitHub откройте `Settings -> Pages`.
4. Выберите публикацию через `GitHub Actions` или через ветку `main`.
5. После деплоя получите публичную ссылку вида `https://username.github.io/repository-name/`.

## Быстрый деплой на Netlify
1. Зайдите в Netlify.
2. Нажмите `Add new site`.
3. Перетащите папку проекта или подключите GitHub-репозиторий.
4. Сайт будет опубликован автоматически.

## Деплой на Vercel с рабочими AI-функциями
1. Загрузите проект на GitHub.
2. В Vercel нажмите `Add New -> Project` и выберите репозиторий.
3. В настройках проекта выберите `Framework Preset: Other`.
4. Оставьте `Build Command` пустым.
5. Укажите `Output Directory: .`, если Vercel попросит директорию вывода.
6. В `Settings -> Environment Variables` добавьте `OPENAI_API_KEY`.
7. Сделайте redeploy проекта.

Дополнительные переменные можно не задавать, но при необходимости они позволяют менять модели:
- `OPENAI_TEXT_MODEL` — модель для чат-бота, по умолчанию `gpt-4o-mini`.
- `OPENAI_IMAGE_MODEL` — модель для генерации изображений, по умолчанию `gpt-image-1`.
- `OPENAI_IMAGE_SIZE` — размер изображения, по умолчанию `1536x1024`.
- `OPENAI_TTS_MODEL` — модель озвучки, по умолчанию `gpt-4o-mini-tts`.
- `OPENAI_TTS_VOICE` — голос озвучки, по умолчанию `alloy`.
- `OPENAI_VIDEO_MODEL` — модель видео, по умолчанию `sora-2`.
- `OPENAI_VIDEO_SECONDS` — длина видео, по умолчанию `4`.
- `OPENAI_VIDEO_SIZE` — размер видео, по умолчанию `1280x720`.

Важно: видео через Sora может требовать доступа к Video API и платного лимита OpenAI. Если видео недоступно, сайт покажет анимированный fallback-аватар.

## Примечание
AI image / audio / video и AI text работают через Vercel Functions в папке `api`. Ключ OpenAI хранится только на стороне Vercel и не попадает в браузер.
