---
name: jscodeshift
description: Лучшие практики разработки кодмодов jscodeshift от Facebook/Meta. Используйте этот навык при написании, проверке или отладке кодмодов jscodeshift. Активируется при выполнении задач, связанных с трансформацией AST, миграцией кода, автоматизированным рефакторингом или разработкой кодмодов.
---

# Лучшие практики jscodeshift от Facebook/Meta

Комплексное руководство по лучшим практикам разработки кодмодов jscodeshift, предназначенное для ИИ-агентов и LLM. Содержит 40 правил в 8 категориях, приоритизированных по уровню влияния: от критических (конфигурация парсера, обход AST) до дополнительных (продвинутые паттерны). Каждое правило включает подробные объяснения, реальные примеры и конкретные метрики влияния.

## Когда применять

Обращайтесь к этому руководству при:
- Написании новых кодмодов jscodeshift для миграции кода
- Отладке сбоев трансформации или неожиданного поведения
- Оптимизации производительности кодмодов на крупных кодовых базах
- Проверке кода кодмодов на корректность
- Тестировании кодмодов на граничные случаи и регрессии

## Категории правил по приоритету

| Приоритет | Категория | Влияние | Префикс |
|----------|----------|--------|--------|
| 1 | Конфигурация парсера | КРИТИЧЕСКОЕ | `parser-` |
| 2 | Паттерны обхода AST | КРИТИЧЕСКОЕ | `traverse-` |
| 3 | Фильтрация узлов | ВЫСОКОЕ | `filter-` |
| 4 | Трансформация AST | ВЫСОКОЕ | `transform-` |
| 5 | Генерация кода | СРЕДНЕЕ | `codegen-` |
| 6 | Стратегии тестирования | СРЕДНЕЕ | `test-` |
| 7 | Оптимизация раннера | НИЗКОЕ-СРЕДНЕЕ | `runner-` |
| 8 | Продвинутые паттерны | НИЗКОЕ | `advanced-` |

## Быстрая справка

### 1. Конфигурация парсера (КРИТИЧЕСКОЕ)

- [`parser-typescript-config`](references/parser-typescript-config.md) — используйте правильный парсер для файлов TypeScript
- [`parser-flow-annotation`](references/parser-flow-annotation.md) — используйте парсер Flow для кода с типизацией Flow
- [`parser-babel5-compat`](references/parser-babel5-compat.md) — избегайте default babel5compat для современного синтаксиса
- [`parser-export-declaration`](references/parser-export-declaration.md) — экспортируйте парсер из модуля трансформации
- [`parser-astexplorer-match`](references/parser-astexplorer-match.md) — сопоставляйте парсер AST Explorer с парсером jscodeshift

### 2. Паттерны обхода AST (КРИТИЧЕСКОЕ)

- [`traverse-find-specific-type`](references/traverse-find-specific-type.md) — используйте конкретные типы узлов в вызовах find()
- [`traverse-two-pass-pattern`](references/traverse-two-pass-pattern.md) — используйте двухпроходный паттерн для сложных трансформаций
- [`traverse-early-return`](references/traverse-early-return.md) — делайте ранний возврат, если трансформация не требуется
- [`traverse-find-filter-pattern`](references/traverse-find-filter-pattern.md) — используйте find() с объектом фильтра вместо цепочки filter()
- [`traverse-closest-scope`](references/traverse-closest-scope.md) — используйте closestScope() для трансформаций с учетом области видимости
- [`traverse-avoid-repeated-find`](references/traverse-avoid-repeated-find.md) — избегайте повторных вызовов find() для одного и того же типа узла

### 3. Фильтрация узлов (ВЫСОКОЕ)

- [`filter-path-parent-check`](references/filter-path-parent-check.md) — проверяйте родительский путь перед трансформацией
- [`filter-import-binding`](references/filter-import-binding.md) — отслеживайте привязки импорта для точного обнаружения использования
- [`filter-nullish-checks`](references/filter-nullish-checks.md) — добавляйте проверки на null/undefined перед доступом к свойствам
- [`filter-jsx-context`](references/filter-jsx-context.md) — отличайте контекст JSX от обычного JavaScript
- [`filter-computed-properties`](references/filter-computed-properties.md) — обрабатывайте вычисляемые ключи свойств в фильтрах

### 4. Трансформация AST (ВЫСОКОЕ)

- [`transform-builder-api`](references/transform-builder-api.md) — используйте API билдера для создания узлов AST
- [`transform-replacewith-callback`](references/transform-replacewith-callback.md) — используйте колбэк replaceWith для трансформаций с учетом контекста
- [`transform-insert-import`](references/transform-insert-import.md) — вставляйте импорты в правильную позицию
- [`transform-preserve-comments`](references/transform-preserve-comments.md) — сохраняйте комментарии при замене узлов
- [`transform-renameto`](references/transform-renameto.md) — используйте renameTo для переименования переменных
- [`transform-remove-unused-imports`](references/transform-remove-unused-imports.md) — удаляйте неиспользуемые импорты после трансформации

### 5. Генерация кода (СРЕДНЕЕ)

- [`codegen-tosource-options`](references/codegen-tosource-options.md) — настраивайте параметры toSource() для согласованного форматирования
- [`codegen-preserve-style`](references/codegen-preserve-style.md) — сохраняйте оригинальный стиль кода с помощью recast
- [`codegen-template-literals`](references/codegen-template-literals.md) — используйте шаблонные литералы для создания сложных узлов
- [`codegen-print-width`](references/codegen-print-width.md) — устанавливайте подходящую ширину печати для длинных строк

### 6. Стратегии тестирования (СРЕДНЕЕ)

- [`test-inline-snapshots`](references/test-inline-snapshots.md) — используйте defineInlineTest для проверки ввода/вывода
- [`test-negative-cases`](references/test-negative-cases.md) — пишите негативные тест-кейсы в первую очередь
- [`test-dry-run-exploration`](references/test-dry-run-exploration.md) — используйте режим dry run для исследования кодовой базы
- [`test-fixture-files`](references/test-fixture-files.md) — используйте файлы фикстур для сложных тест-кейсов
- [`test-parse-errors`](references/test-parse-errors.md) — тестируйте обработку ошибок парсинга

### 7. Оптимизация раннера (НИЗКОЕ-СРЕДНЕЕ)

- [`runner-parallel-workers`](references/runner-parallel-workers.md) — настраивайте количество воркеров для оптимального распараллеливания
- [`runner-ignore-patterns`](references/runner-ignore-patterns.md) — используйте паттерны игнорирования для пропуска неисходных файлов
- [`runner-extensions-filter`](references/runner-extensions-filter.md) — фильтруйте файлы по расширению
- [`runner-batch-processing`](references/runner-batch-processing.md) — обрабатывайте крупные кодовые базы пакетами
- [`runner-verbose-output`](references/runner-verbose-output.md) — используйте подробный вывод для отладки трансформаций

### 8. Продвинутые паттерны (НИЗКОЕ)

- [`advanced-compose-transforms`](references/advanced-compose-transforms.md) — объединяйте несколько трансформаций в конвейеры (pipelines)
- [`advanced-scope-analysis`](references/advanced-scope-analysis.md) — используйте анализ области видимости для безопасных трансформаций переменных
- [`advanced-multi-file-state`](references/advanced-multi-file-state.md) — разделяйте состояние между файлами с помощью опций
- [`advanced-custom-collections`](references/advanced-custom-collections.md) — создавайте пользовательские методы коллекций

## Как использовать

Читайте отдельные справочные файлы для получения подробных объяснений и примеров кода:

- [Определения разделов](references/_sections.md) — структура категорий и уровни влияния
- [Шаблон правила](assets/templates/_template.md) — шаблон для добавления новых правил

## Полный скомпилированный документ

Для получения единого комплексного документа, содержащего все правила, см. [AGENTS.md](AGENTS.md).

## Справочные файлы

| Файл | Описание |
|------|-------------|
| [AGENTS.md](AGENTS.md) | Полное скомпилированное руководство со всеми правилами |
| [references/_sections.md](references/_sections.md) | Определения категорий и порядок |
| [assets/templates/_template.md](assets/templates/_template.md) | Шаблон для новых правил |
| [metadata.json](metadata.json) | Информация о версии и ссылки |
