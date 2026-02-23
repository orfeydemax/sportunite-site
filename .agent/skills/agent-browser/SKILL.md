---
name: agent-browser
description: "Автоматизация браузера для ИИ-агентов через inference.sh. Навигация по страницам, взаимодействие с элементами через ссылки @e, создание скриншотов и запись видео. Возможности: веб-скрейпинг, заполнение форм, клики, ввод текста, drag-and-drop, загрузка файлов, выполнение JavaScript. Применение: автоматизация веб-задач, извлечение данных, тестирование, поиск информации ИИ-агентами. Триггеры: browser, web automation, scrape, navigate, click, fill form, screenshot, browse web, playwright, headless browser, web agent, surf internet, record video"
allowed-tools: Bash(infsh *)
---

# Агентный браузер

Автоматизация браузера для ИИ-агентов через [inference.sh](https://inference.sh). Использует Playwright под капотом с простой системой ссылок `@e` для взаимодействия с элементами.

![Агентный браузер](https://cloud.inference.sh/app/files/u/4mg21r6ta37mpaz6ktzwtt8krr/01kgjw8atdxgkrsr8a2t5peq7b.jpeg)

## Быстрый старт

```bash
# Установка CLI
curl -fsSL https://cli.inference.sh | sh && infsh login

# Открыть страницу и получить интерактивные элементы
infsh app run agent-browser --function open --input '{"url": "https://example.com"}' --session new
```

> **Примечание по установке:** [Скрипт установки](https://cli.inference.sh) только определяет вашу ОС/архитектуру, загружает соответствующий бинарный файл с `dist.inference.sh` и проверяет его контрольную сумму SHA-256. Не требуются повышенные привилегии или фоновые процессы. Доступна [ручная установка и проверка](https://dist.inference.sh/cli/checksums.txt).

## Основной рабочий процесс

Любая автоматизация браузера следует этому шаблону:

1. **Open** — Переход по URL, получение ссылок `@e` для элементов.
2. **Interact** — Использование ссылок для кликов, заполнения форм, перетаскивания и т.д.
3. **Re-snapshot** — После навигации или изменений получение свежих ссылок.
4. **Close** — Завершение сессии (возвращает видео, если велась запись).

```bash
# 1. Запуск сессии
RESULT=$(infsh app run agent-browser --function open --session new --input '{
  "url": "https://example.com/login"
}')
SESSION_ID=$(echo $RESULT | jq -r '.session_id')
# Элементы: @e1 [input] "Email", @e2 [input] "Password", @e3 [button] "Sign In"

# 2. Заполнение и отправка
infsh app run agent-browser --function interact --session $SESSION_ID --input '{
  "action": "fill", "ref": "@e1", "text": "user@example.com"
}'
infsh app run agent-browser --function interact --session $SESSION_ID --input '{
  "action": "fill", "ref": "@e2", "text": "password123"
}'
infsh app run agent-browser --function interact --session $SESSION_ID --input '{
  "action": "click", "ref": "@e3"
}'

# 3. Снятие обновленного снимка после навигации
infsh app run agent-browser --function snapshot --session $SESSION_ID --input '{}'

# 4. Закрытие сессии по завершении
infsh app run agent-browser --function close --session $SESSION_ID --input '{}'
```

## Функции

| Функция | Описание |
|----------|-------------|
| `open` | Переход по URL, настройка браузера (viewport, прокси, запись видео) |
| `snapshot` | Повторное получение состояния страницы со ссылками `@e` после изменений DOM |
| `interact` | Выполнение действий с использованием ссылок `@e` (клик, заполнение, перетаскивание, загрузка и т.д.) |
| `screenshot` | Создание скриншота страницы (область просмотра или вся страница) |
| `execute` | Выполнение JavaScript-кода на странице |
| `close` | Закрытие сессии, возвращает видео, если запись была включена |

## Действия взаимодействия (Interact Actions)

| Действие | Описание | Обязательные поля |
|--------|-------------|-----------------|
| `click` | Клик по элементу | `ref` |
| `dblclick` | Двойной клик по элементу | `ref` |
| `fill` | Очистка и ввод текста | `ref`, `text` |
| `type` | Ввод текста (без очистки) | `text` |
| `press` | Нажатие клавиши (Enter, Tab и т.д.) | `text` |
| `select` | Выбор опции в выпадающем списке | `ref`, `text` |
| `hover` | Наведение курсора на элемент | `ref` |
| `check` | Отметить чекбокс | `ref` |
| `uncheck` | Снять отметку с чекбокса | `ref` |
| `drag` | Перетаскивание (Drag-and-drop) | `ref`, `target_ref` |
| `upload` | Загрузка файла(ов) | `ref`, `file_paths` |
| `scroll` | Прокрутка страницы | `direction` (up/down/left/right), `scroll_amount` |
| `back` | Перейти назад в истории | - |
| `wait` | Ожидание в миллисекундах | `wait_ms` |
| `goto` | Переход по URL | `url` |

## Ссылки на элементы (@e refs)

Элементы возвращаются со ссылками `@e`:

```
@e1 [a] "Home" href="/"
@e2 [input type="text"] placeholder="Search"
@e3 [button] "Submit"
@e4 [select] "Choose option"
@e5 [input type="checkbox"] name="agree"
```

**Важно:** Ссылки становятся недействительными после навигации. Всегда делайте `snapshot` после:
- Клика по ссылкам/кнопкам, которые вызывают переход.
- Отправки форм.
- Динамической загрузки контента.

## Особенности

### Запись видео

Записывайте сессии браузера для отладки или документации:

```bash
# Запуск с включенной записью (опционально с индикатором курсора)
SESSION=$(infsh app run agent-browser --function open --session new --input '{
  "url": "https://example.com",
  "record_video": true,
  "show_cursor": true
}' | jq -r '.session_id')

# ... выполнение действий ...

# Закрытие для получения файла видео
infsh app run agent-browser --function close --session $SESSION --input '{}'
# Возвращает: {"success": true, "video": <File>}
```

### Индикатор курсора

Показывает видимый курсор на скриншотах и видео (полезно для демо):

```bash
infsh app run agent-browser --function open --session new --input '{
  "url": "https://example.com",
  "show_cursor": true,
  "record_video": true
}'
```

Курсор отображается как красная точка, которая следует за движениями мыши и показывает визуальный отклик при кликах.

### Поддержка прокси

Маршрутизация трафика через прокси-сервер:

```bash
infsh app run agent-browser --function open --session new --input '{
  "url": "https://example.com",
  "proxy_url": "http://proxy.example.com:8080",
  "proxy_username": "user",
  "proxy_password": "pass"
}'
```

### Загрузка файлов

Загрузка файлов в элементы `input` типа `file`:

```bash
infsh app run agent-browser --function interact --session $SESSION --input '{
  "action": "upload",
  "ref": "@e5",
  "file_paths": ["/path/to/file.pdf"]
}'
```

### Перетаскивание (Drag and Drop)

Перетаскивание элементов на цели:

```bash
infsh app run agent-browser --function interact --session $SESSION --input '{
  "action": "drag",
  "ref": "@e1",
  "target_ref": "@e2"
}'
```

### Выполнение JavaScript

Выполнение произвольного JavaScript-кода:

```bash
infsh app run agent-browser --function execute --session $SESSION --input '{
  "code": "document.querySelectorAll(\"h2\").length"
}'
# Возвращает: {"result": "5", "screenshot": <File>}
```

## Углубленная документация

| Ссылка | Описание |
|-----------|-------------|
| [references/commands.md](references/commands.md) | Полный справочник функций со всеми опциями |
| [references/snapshot-refs.md](references/snapshot-refs.md) | Жизненный цикл ссылок, правила аннулирования, решение проблем |
| [references/session-management.md](references/session-management.md) | Управление сессиями, параллельные сессии |
| [references/authentication.md](references/authentication.md) | Процессы входа (login), OAuth, обработка 2FA |
| [references/video-recording.md](references/video-recording.md) | Рабочие процессы записи для отладки |
| [references/proxy-support.md](references/proxy-support.md) | Настройка прокси, гео-тестирование |

## Готовые шаблоны

| Шаблон | Описание |
|----------|-------------|
| [templates/form-automation.sh](templates/form-automation.sh) | Автоматизация заполнения форм с валидацией |
| [templates/authenticated-session.sh](templates/authenticated-session.sh) | Однократный вход и повторное использование сессии |
| [templates/capture-workflow.sh](templates/capture-workflow.sh) | Извлечение контента со скриншотами |

## Примеры

### Отправка формы

```bash
SESSION=$(infsh app run agent-browser --function open --session new --input '{
  "url": "https://example.com/contact"
}' | jq -r '.session_id')

# Получение элементов: @e1 [input] "Name", @e2 [input] "Email", @e3 [textarea], @e4 [button] "Send"

infsh app run agent-browser --function interact --session $SESSION --input '{"action": "fill", "ref": "@e1", "text": "John Doe"}'
infsh app run agent-browser --function interact --session $SESSION --input '{"action": "fill", "ref": "@e2", "text": "john@example.com"}'
infsh app run agent-browser --function interact --session $SESSION --input '{"action": "fill", "ref": "@e3", "text": "Привет!"}'
infsh app run agent-browser --function interact --session $SESSION --input '{"action": "click", "ref": "@e4"}'

infsh app run agent-browser --function snapshot --session $SESSION --input '{}'
infsh app run agent-browser --function close --session $SESSION --input '{}'
```

### Поиск и извлечение данных

```bash
SESSION=$(infsh app run agent-browser --function open --session new --input '{
  "url": "https://google.com"
}' | jq -r '.session_id')

infsh app run agent-browser --function interact --session $SESSION --input '{"action": "fill", "ref": "@e1", "text": "погода сегодня"}'
infsh app run agent-browser --function interact --session $SESSION --input '{"action": "press", "text": "Enter"}'
infsh app run agent-browser --function interact --session $SESSION --input '{"action": "wait", "wait_ms": 2000}'

infsh app run agent-browser --function snapshot --session $SESSION --input '{}'
infsh app run agent-browser --function close --session $SESSION --input '{}'
```

### Скриншот с видео

```bash
SESSION=$(infsh app run agent-browser --function open --session new --input '{
  "url": "https://example.com",
  "record_video": true
}' | jq -r '.session_id')

# Создание скриншота всей страницы
infsh app run agent-browser --function screenshot --session $SESSION --input '{
  "full_page": true
}'

# Закрытие и получение видео
RESULT=$(infsh app run agent-browser --function close --session $SESSION --input '{}')
echo $RESULT | jq '.video'
```

## Сессии

Состояние браузера сохраняется внутри сессии. Всегда:

1. Начинайте с `--session new` при первом вызове.
2. Используйте полученный `session_id` для последующих вызовов.
3. Закрывайте сессию по завершении.

## Связанные навыки

```bash
# Веб-поиск (для исследований + браузинга)
npx skills add inference-sh/skills@web-search

# LLM модели (анализ извлеченного контента)
npx skills add inference-sh/skills@llm-models
```

## Документация

- [inference.sh Sessions](https://inference.sh/docs/extend/sessions) — Управление сессиями
- [Multi-function Apps](https://inference.sh/docs/extend/multi-function-apps) — Как работают функции
