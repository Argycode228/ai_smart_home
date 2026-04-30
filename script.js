const state = { tableCounter: 1 };

const weatherCodes = {
  0: 'Ясно', 1: 'Преимущественно ясно', 2: 'Переменная облачность', 3: 'Пасмурно',
  45: 'Туман', 48: 'Инейный туман', 51: 'Лёгкая морось', 53: 'Морось', 55: 'Сильная морось',
  61: 'Слабый дождь', 63: 'Дождь', 65: 'Сильный дождь', 71: 'Слабый снег', 73: 'Снег', 75: 'Сильный снег',
  80: 'Ливни', 81: 'Сильные ливни', 82: 'Очень сильные ливни', 85: 'Слабый снегопад', 86: 'Сильный снегопад',
  95: 'Гроза', 96: 'Гроза с градом', 99: 'Сильная гроза с градом',
};

const sensorEvents = [
  { device: 'Температурный сенсор', values: ['21°C', '22°C', '24°C', '19°C'], status: 'ok' },
  { device: 'Датчик движения', values: ['Движение обнаружено', 'Тихо', 'Низкая активность'], status: 'warn' },
  { device: 'Смарт-замок', values: ['Закрыт', 'Открыт по PIN', 'Автоблокировка'], status: 'ok' },
  { device: 'Камера входа', values: ['Стрим активен', 'Режим записи', 'Распознавание лица'], status: 'ok' },
  { device: 'Датчик дыма', values: ['Норма', 'Проверка батареи', 'Требуется осмотр'], status: 'alert' },
  { device: 'Световой сенсор', values: ['Освещённость 68%', 'Освещённость 41%', 'Ночной режим'], status: 'ok' },
  { device: 'Вентиляция', values: ['Скорость 1', 'Скорость 2', 'Эко-режим'], status: 'ok' },
];

const chatBox = document.getElementById('chatBox');
const chatStatus = document.getElementById('chatStatus');

function $(id) {
  return document.getElementById(id);
}

function encodePrompt(text) {
  return encodeURIComponent(String(text || '').trim().replace(/\s+/g, ' '));
}

function slugPrompt(text) {
  return String(text || '').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 220);
}

function setStatus(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

function shortError(error) {
  return error?.message ? error.message.replace(/\s+/g, ' ').slice(0, 130) : 'неизвестная ошибка';
}

async function postJson(path, payload) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || `HTTP ${response.status}`);
  return data;
}

async function getJson(path) {
  const response = await fetch(path);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || `HTTP ${response.status}`);
  return data;
}

async function postBlob(path, payload) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || data.error || `HTTP ${response.status}`);
  }
  return response.blob();
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tryImageUrls(image, urls, index = 0) {
  if (index >= urls.length) {
    setStatus('imageStatus', 'Pollinations сейчас не отдал картинку. Нажмите кнопку ещё раз через минуту.');
    return;
  }

  image.onload = () => setStatus('imageStatus', 'Изображение загружено через Pollinations.');
  image.onerror = () => tryImageUrls(image, urls, index + 1);
  image.src = urls[index];
}

async function generateImage() {
  const prompt = $('imagePrompt').value.trim();
  if (!prompt) return;

  const image = $('generatedImage');
  const encoded = encodePrompt(prompt);
  const seed = Date.now();
  const urls = [
    `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&model=flux&nologo=true&safe=true&seed=${seed}`,
    `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=768&model=turbo&nologo=true&safe=true&seed=${seed}`,
    `https://gen.pollinations.ai/image/${encoded}?width=1280&height=720&nologo=true&safe=true&seed=${seed}`,
    `https://pollinations.ai/p/${slugPrompt(prompt) || 'smart_home_ai'}`,
  ];

  setStatus('imageStatus', 'Генерирую изображение через Pollinations...');
  $('promptEcho').textContent = prompt;
  const badge = $('imageBadge');
  if (badge) badge.textContent = 'Pollinations';
  tryImageUrls(image, urls);
}

async function getCoordinates(city) {
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodePrompt(city)}&count=1&language=ru&format=json`);
  if (!response.ok) throw new Error('Geocoding error');
  const data = await response.json();
  if (!data.results || !data.results.length) throw new Error('City not found');
  return data.results[0];
}

async function loadWeather() {
  const manualCity = $('cityInput').value.trim();
  const city = manualCity || $('cityPreset').value;
  if (!city) return;
  setStatus('weatherStatus', 'Ищу город и загружаю погоду...');

  try {
    const geo = await getCoordinates(city);
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current=temperature_2m,weather_code,wind_speed_10m,precipitation&hourly=temperature_2m,weather_code&forecast_hours=12&timezone=auto`;
    const response = await fetch(weatherUrl);
    if (!response.ok) throw new Error('Weather fetch error');
    renderWeather(geo, await response.json());
    setStatus('weatherStatus', 'Погода успешно загружена.');
  } catch (error) {
    console.error(error);
    setStatus('weatherStatus', 'Не удалось получить погоду. Проверьте название города.');
  }
}

function renderWeather(geo, data) {
  const current = data.current;
  const temperature = Math.round(current.temperature_2m);
  const code = current.weather_code;
  const wind = Math.round(current.wind_speed_10m);
  $('weatherCity').textContent = `${geo.name}, ${geo.country || ''}`.replace(/,\s*$/, '');
  $('weatherMeta').textContent = `${geo.admin1 || '—'} · Часовой пояс: ${geo.timezone || 'local'}`;
  $('weatherTemp').textContent = `${temperature}°C`;
  $('weatherCondition').textContent = weatherCodes[code] || 'Неизвестно';
  $('weatherWind').textContent = `${wind} км/ч`;
  $('weatherRain').textContent = `${Number(current.precipitation || 0).toFixed(1)} мм`;

  const advice = getHomeAdvice(temperature, code, wind);
  $('homeMode').textContent = advice.mode;
  $('homeAdvice').textContent = advice.summary;
  $('heatingAdvice').textContent = advice.heating;
  $('ventAdvice').textContent = advice.ventilation;
  $('securityAdvice').textContent = advice.security;
  $('energyAdvice').textContent = advice.energy;

  const grid = $('forecastGrid');
  grid.innerHTML = '';
  data.hourly.time.slice(0, 6).forEach((time, index) => {
    const card = document.createElement('div');
    const temp = Math.round(data.hourly.temperature_2m[index]);
    const label = weatherCodes[data.hourly.weather_code[index]] || '—';
    card.innerHTML = `<span>${new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><strong>${temp}°C</strong><span>${label}</span>`;
    grid.appendChild(card);
  });
}

function getHomeAdvice(temp, code, wind) {
  const rainy = [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code);
  const snowy = [71, 73, 75, 85, 86].includes(code);
  const storm = [95, 96, 99].includes(code) || wind >= 40;
  if (storm) return { mode: 'Защитный режим', summary: 'На улице сильный ветер или гроза. Дом усиливает безопасность и контроль энергии.', heating: temp < 8 ? 'Поддерживать 21°C' : 'Норма', ventilation: 'Минимальный приток', security: 'Проверить окна и камеры', energy: 'Снизить лишние нагрузки' };
  if (temp <= 10 || snowy) return { mode: 'Тёплый комфорт', summary: 'Погода прохладная. Лучше заранее прогреть комнаты и сократить лишнюю вентиляцию.', heating: 'Активировать обогрев', ventilation: 'Короткие циклы', security: 'Обычный контроль', energy: 'Утеплённый режим' };
  if (temp >= 28) return { mode: 'Летний эко-режим', summary: 'На улице жарко. Включите вентиляцию, затенение окон и экономичный режим охлаждения.', heating: 'Выключить', ventilation: 'Усилить охлаждение', security: 'Проверка перегрева', energy: 'Экономия' };
  if (rainy) return { mode: 'Уют и защита', summary: 'Ожидаются осадки. Закройте окна, включите мягкий свет и наблюдение у входа.', heating: temp < 16 ? 'Лёгкий подогрев' : 'Норма', ventilation: 'По влажности', security: 'Контроль входа', energy: 'Баланс' };
  return { mode: 'Сбалансированный режим', summary: 'Погода комфортная. Дом может работать в обычном автоматическом режиме.', heating: 'Авто', ventilation: 'Авто', security: 'Стандарт', energy: 'Оптимально' };
}

function getStatusBadge(status) {
  if (status === 'alert') return '<span class="badge alert">Проверить</span>';
  if (status === 'warn') return '<span class="badge warn">Внимание</span>';
  return '<span class="badge ok">Норма</span>';
}

function addRow() {
  const event = sensorEvents[Math.floor(Math.random() * sensorEvents.length)];
  const value = event.values[Math.floor(Math.random() * event.values.length)];
  const row = document.createElement('tr');
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  row.innerHTML = `<td>${state.tableCounter}</td><td>${now}</td><td>${event.device}</td><td>${value}</td><td>${getStatusBadge(event.status)}</td>`;
  document.querySelector('#sensorTable tbody').prepend(row);
  state.tableCounter += 1;
}

function addBatch(rows = 5) {
  for (let i = 0; i < rows; i += 1) addRow();
}

function clearTable() {
  document.querySelector('#sensorTable tbody').innerHTML = '';
  state.tableCounter = 1;
}

function setTalking(active) {
  $('avatarMouth').classList.toggle('talking', active);
}

function speakText(text) {
  if (!('speechSynthesis' in window)) {
    alert('В этом браузере не поддерживается озвучка.');
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ru-RU';
  utterance.rate = 1;
  utterance.pitch = 1.05;
  utterance.onstart = () => setTalking(true);
  utterance.onend = () => setTalking(false);
  utterance.onerror = () => setTalking(false);
  window.speechSynthesis.speak(utterance);
}

async function pollVideo(videoId) {
  for (let attempt = 0; attempt < 36; attempt += 1) {
    const data = await getJson(`/api/video-status?id=${encodeURIComponent(videoId)}`);
    const progress = typeof data.progress === 'number' ? `${Math.round(data.progress)}%` : 'в обработке';
    if (data.status === 'completed') return data;
    if (data.status === 'failed') throw new Error(data.error?.message || 'Видео не удалось сгенерировать.');
    setStatus('videoStatus', `Видео генерируется: ${data.status || 'queued'}, ${progress}.`);
    await wait(8000);
  }
  throw new Error('Видео ещё генерируется. Попробуйте открыть результат позже.');
}

async function generateVideo() {
  const prompt = $('videoPrompt').value.trim();
  if (!prompt) return;
  const video = $('aiVideo');
  const placeholder = $('videoPlaceholder');
  setStatus('videoStatus', 'Запускаю генерацию Sora-видео через Vercel API...');
  video.removeAttribute('src');
  video.load();
  video.style.display = 'none';
  placeholder.style.display = 'block';
  try {
    const job = await postJson('/api/video', { prompt });
    setStatus('videoStatus', `Видео запущено: ${job.status || 'queued'}.`);
    const result = await pollVideo(job.id);
    video.onloadeddata = () => setStatus('videoStatus', 'Видео загружено.');
    video.onerror = () => setStatus('videoStatus', 'Видео готово, но браузер не смог его воспроизвести.');
    video.src = `/api/video-content?id=${encodeURIComponent(result.id)}&t=${Date.now()}`;
    video.style.display = 'block';
    placeholder.style.display = 'none';
    video.load();
  } catch (error) {
    console.error(error);
    setStatus('videoStatus', `Видео недоступно: ${shortError(error)}. Аватар остаётся рабочим fallback.`);
  }
}

async function generateAudio() {
  const prompt = $('audioPrompt').value.trim();
  if (!prompt) return;
  const audio = $('aiAudio');
  setStatus('audioStatus', 'Генерирую AI-аудио через Vercel API...');
  try {
    const blob = await postBlob('/api/audio', { prompt });
    if (audio.dataset.objectUrl) URL.revokeObjectURL(audio.dataset.objectUrl);
    const objectUrl = URL.createObjectURL(blob);
    audio.dataset.objectUrl = objectUrl;
    audio.oncanplay = () => setStatus('audioStatus', 'Аудио готово к воспроизведению.');
    audio.onerror = () => setStatus('audioStatus', 'Аудио получено, но браузер не смог его воспроизвести.');
    audio.src = objectUrl;
    audio.load();
  } catch (error) {
    console.error(error);
    setStatus('audioStatus', `OpenAI audio недоступно: ${shortError(error)}. Запускаю браузерную озвучку.`);
    speakText(prompt);
  }
}

function addMessage(role, text) {
  const message = document.createElement('div');
  message.className = `message ${role}`;
  message.textContent = text;
  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function fallbackAnswer(input) {
  const text = input.toLowerCase();
  if (text.includes('iot') || text.includes('айоти')) return 'IoT — это сеть устройств, которые подключены к интернету и обмениваются данными. В умном доме это датчики, камеры, освещение и замки.';
  if (text.includes('датчик') || text.includes('сенсор')) return 'Датчик собирает данные: температуру, движение, свет, дым или влажность. Потом система использует эти данные для автоматических действий.';
  if (text.includes('агент')) return 'AI-агент получает данные, интерпретирует их и рекомендует режим дома: комфорт, экономия или защита.';
  if (text.includes('безопас')) return 'Для безопасности нужны камеры, смарт-замки, датчики движения, дымовые датчики и уведомления.';
  return 'Я могу объяснить IoT, датчики, AI-агента, безопасность и работу умного дома. Задайте вопрос чуть конкретнее.';
}

async function askBot() {
  const input = $('chatInput');
  const question = input.value.trim();
  if (!question) return;
  addMessage('user', question);
  input.value = '';
  chatStatus.textContent = 'Формирую ответ...';
  try {
    const data = await postJson('/api/chat', { question });
    addMessage('bot', data.answer || fallbackAnswer(question));
    chatStatus.textContent = `Ответ получен через ${data.model || 'OpenAI API'}.`;
  } catch (error) {
    console.error(error);
    addMessage('bot', fallbackAnswer(question));
    chatStatus.textContent = `AI backend недоступен: ${shortError(error)}. Включён встроенный режим.`;
  }
}

function initQuickButtons() {
  document.querySelectorAll('[data-prompt]').forEach((button) => {
    button.addEventListener('click', () => {
      $('imagePrompt').value = button.dataset.prompt;
      generateImage();
    });
  });
  document.querySelectorAll('[data-speak]').forEach((button) => {
    button.addEventListener('click', () => speakText(button.dataset.speak));
  });
  document.querySelectorAll('.quick-question').forEach((button) => {
    button.addEventListener('click', () => {
      $('chatInput').value = button.textContent.trim();
      askBot();
    });
  });
}

function initEvents() {
  $('generateImageBtn').addEventListener('click', generateImage);
  $('loadWeatherBtn').addEventListener('click', loadWeather);
  $('cityPreset').addEventListener('change', (event) => { $('cityInput').value = event.target.value; });
  $('addRowBtn').addEventListener('click', addRow);
  $('addBatchBtn').addEventListener('click', () => addBatch(5));
  $('clearTableBtn').addEventListener('click', clearTable);
  $('generateVideoBtn').addEventListener('click', generateVideo);
  $('generateAudioBtn').addEventListener('click', generateAudio);
  $('sendChatBtn').addEventListener('click', askBot);
  $('chatInput').addEventListener('keydown', (event) => { if (event.key === 'Enter') askBot(); });
}

document.addEventListener('DOMContentLoaded', () => {
  initEvents();
  initQuickButtons();
  addBatch(4);
  addMessage('bot', 'Здравствуйте! Я AI-помощник по smart home. Спросите про IoT, датчики, безопасность или AI-агента.');
  generateImage();
  loadWeather();
});
