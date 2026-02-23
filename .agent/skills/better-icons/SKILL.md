---
name: better-icons
description: 'Используйте при работе с иконками в любом проекте. Предоставляет CLI для поиска в 200+ библиотеках иконок (Iconify) и получения SVG. Команды: `better-icons search <query>` для поиска иконок, `better-icons get <id>` для получения SVG. Также доступен как MCP-сервер для ИИ-агентов.'
---

# Better Icons

Поиск и получение иконок из более чем 200 библиотек через Iconify.

## CLI

```bash
# Поиск иконок
better-icons search <query> [--prefix <prefix>] [--limit <n>] [--json]

# Получение SVG иконки (вывод в stdout)
better-icons get <icon-id> [--color <color>] [--size <px>] [--json]

# Настройка MCP-сервера для ИИ-агентов
better-icons setup [-a cursor,claude-code] [-s global|project]
```

## Примеры

```bash
better-icons search arrow --limit 10
better-icons search home --json | jq '.icons[0]'
better-icons get lucide:home > icon.svg
better-icons get mdi:home --color '#333' --json
```

## Формат ID иконки

`prefix:name` — например, `lucide:home`, `mdi:arrow-right`, `heroicons:check`

## Популярные коллекции

`lucide`, `mdi`, `heroicons`, `tabler`, `ph`, `ri`, `solar`, `iconamoon`

---

## MCP-инструменты (для ИИ-агентов)

| Инструмент | Описание |
|------|-------------|
| `search_icons` | Поиск по всем библиотекам |
| `get_icon` | Получение SVG одной иконки |
| `get_icons` | Пакетное получение нескольких иконок |
| `list_collections` | Просмотр доступных наборов иконок |
| `recommend_icons` | Умные рекомендации для различных случаев использования |
| `find_similar_icons` | Поиск вариаций в разных коллекциях |
| `sync_icon` | Добавление иконки в файл проекта |
| `scan_project_icons` | Список иконок, используемых в проекте |

## TypeScript интерфейсы

```typescript
interface SearchIcons {
  query: string
  limit?: number        // 1-999, по умолчанию 32
  prefix?: string       // например, 'mdi', 'lucide'
  category?: string     // например, 'General', 'Emoji'
}

interface GetIcon {
  icon_id: string       // формат 'prefix:name'
  color?: string        // например, '#ff0000', 'currentColor'
  size?: number         // в пикселях
}

interface GetIcons {
  icon_ids: string[]    // макс. 20
  color?: string
  size?: number
}

interface RecommendIcons {
  use_case: string      // например, 'navigation menu'
  style?: 'solid' | 'outline' | 'any'
  limit?: number        // по умолчанию 10
}

interface SyncIcon {
  icons_file: string    // абсолютный путь
  framework: 'react' | 'vue' | 'svelte' | 'solid' | 'svg'
  icon_id: string
  component_name?: string
}
```

## API

Все иконки загружаются с `https://api.iconify.design`
