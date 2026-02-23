---
name: agent-tools
description: "Запуск 150+ ИИ-приложений через CLI inference.sh — генерация изображений, создание видео, LLM, поиск, 3D, автоматизация Twitter. Модели: FLUX, Veo, Gemini, Grok, Claude, Seedance, OmniHuman, Tavily, Exa, OpenRouter и многие другие. Используйте для запуска ИИ-приложений, генерации изображений/видео, вызова LLM, поиска в вебе или автоматизации Twitter. Триггеры: inference.sh, infsh, ai model, run ai, serverless ai, ai api, flux, veo, claude api, image generation, video generation, openrouter, tavily, exa search, twitter api, grok"
allowed-tools: Bash(infsh *)
---

# [inference.sh](https://inference.sh)

Запускайте более 150 ИИ-приложений в облаке с помощью простого CLI. GPU не требуется.

![[inference.sh](https://inference.sh)](https://cloud.inference.sh/app/files/u/4mg21r6ta37mpaz6ktzwtt8krr/01kgjw8atdxgkrsr8a2t5peq7b.jpeg)

## Установка CLI

```bash
curl -fsSL https://cli.inference.sh | sh
infsh login
```

> **Что делает установщик?** [Скрипт установки](https://cli.inference.sh) определяет вашу ОС и архитектуру, загружает соответствующий бинарный файл с `dist.inference.sh`, проверяет его контрольную сумму SHA-256 и добавляет его в ваш PATH. Это всё — никаких повышенных привилегий, фоновых процессов или телеметрии. Если у вас установлен [cosign](https://docs.sigstore.dev/cosign/system_config/installation/), установщик также автоматически проверит подпись Sigstore.
>
> **Ручная установка** (если вы предпочитаете не использовать pipe в sh):
> ```bash
> # Загрузка бинарного файла и контрольных сумм
> curl -LO https://dist.inference.sh/cli/checksums.txt
> curl -LO $(curl -fsSL https://dist.inference.sh/cli/manifest.json | grep -o '"url":"[^"]*"' | grep $(uname -s | tr A-Z a-z)-$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/') | head -1 | cut -d'"' -f4)
> # Проверка контрольной суммы
> sha256sum -c checksums.txt --ignore-missing
> # Извлечение и установка
> tar -xzf inferencesh-cli-*.tar.gz
> mv inferencesh-cli-* ~/.local/bin/inferencesh
> ```

## Быстрые примеры

```bash
# Генерация изображения
infsh app run falai/flux-dev-lora --input '{"prompt": "a cat astronaut"}'

# Генерация видео
infsh app run google/veo-3-1-fast --input '{"prompt": "drone over mountains"}'

# Вызов Claude
infsh app run openrouter/claude-sonnet-45 --input '{"prompt": "Explain quantum computing"}'

# Поиск в вебе
infsh app run tavily/search-assistant --input '{"query": "latest AI news"}'

# Пост в Twitter
infsh app run x/post-tweet --input '{"text": "Hello from AI!"}'

# Генерация 3D-модели
infsh app run infsh/rodin-3d-generator --input '{"prompt": "a wooden chair"}'
```

## Команды

| Задача | Команда |
|------|---------|
| Список всех приложений | `infsh app list` |
| Поиск приложений | `infsh app list --search "flux"` |
| Фильтр по категории | `infsh app list --category image` |
| Получить детали приложения | `infsh app get google/veo-3-1-fast` |
| Сгенерировать пример ввода | `infsh app sample google/veo-3-1-fast --save input.json` |
| Запустить приложение | `infsh app run google/veo-3-1-fast --input input.json` |
| Запустить без ожидания | `infsh app run <app> --input input.json --no-wait` |
| Проверить статус задачи | `infsh task get <task-id>` |

## Что доступно

| Категория | Примеры |
|----------|----------|
| **Изображения** | FLUX, Gemini 3 Pro, Grok Imagine, Seedream 4.5, Reve, Topaz Upscaler |
| **Видео** | Veo 3.1, Seedance 1.5, Wan 2.5, OmniHuman, Fabric, HunyuanVideo Foley |
| **LLMs** | Claude Opus/Sonnet/Haiku, Gemini 3 Pro, Kimi K2, GLM-4, любая модель из OpenRouter |
| **Поиск** | Tavily Search, Tavily Extract, Exa Search, Exa Answer, Exa Extract |
| **3D** | Rodin 3D Generator |
| **Twitter/X** | post-tweet, post-create, dm-send, user-follow, post-like, post-retweet |
| **Утилиты** | Media merger, субтитры для видео, склейка изображений, извлечение аудио |

## Связанные навыки

```bash
# Генерация изображений (FLUX, Gemini, Grok, Seedream)
npx skills add inference-sh/skills@ai-image-generation

# Генерация видео (Veo, Seedance, Wan, OmniHuman)
npx skills add inference-sh/skills@ai-video-generation

# LLM (Claude, Gemini, Kimi, GLM через OpenRouter)
npx skills add inference-sh/skills@llm-models

# Поиск в вебе (Tavily, Exa)
npx skills add inference-sh/skills@web-search

# AI аватары и lipsync (OmniHuman, Fabric, PixVerse)
npx skills add inference-sh/skills@ai-avatar-video

# Автоматизация Twitter/X
npx skills add inference-sh/skills@twitter-automation

# Специфично для моделей
npx skills add inference-sh/skills@flux-image
npx skills add inference-sh/skills@google-veo

# Утилиты
npx skills add inference-sh/skills@image-upscaling
npx skills add inference-sh/skills@background-removal
```

## Справочные файлы

- [Аутентификация и настройка](references/authentication.md)
- [Поиск приложений](references/app-discovery.md)
- [Запуск приложений](references/running-apps.md)
- [Справочник CLI](references/cli-reference.md)

## Документация

- [Обзор навыков агентов](https://inference.sh/blog/skills/skills-overview) — Открытый стандарт для возможностей ИИ
- [Начало работы](https://inference.sh/docs/getting-started/introduction) — Введение в inference.sh
- [Что такое inference.sh?](https://inference.sh/docs/getting-started/what-is-inference) — Обзор платформы
- [Обзор приложений](https://inference.sh/docs/apps/overview) — Понимание экосистемы приложений
- [Настройка CLI](https://inference.sh/docs/extend/cli-setup) — Установка CLI
- [Рабочие процессы vs Агенты](https://inference.sh/blog/concepts/workflows-vs-agents) — Когда что использовать
- [Почему важна среда выполнения агента](https://inference.sh/blog/agent-runtime/why-runtimes-matter) — Преимущества среды выполнения
