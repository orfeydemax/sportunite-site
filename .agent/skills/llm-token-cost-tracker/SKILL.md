---
name: llm-token-cost-tracker
description: Отслеживает использование и стоимость вызовов LLM от различных провайдеров (OpenAI, Anthropic, Gemini и др.).
---

# LLM Token Cost Tracker

Этот навык предоставляет централизованный механизм для отслеживания использования токенов LLM и расчета затрат на основе актуальных цен.

## Возможности

- **Поддержка нескольких провайдеров**: OpenAI, Anthropic, Gemini, Cohere, xAI, Bedrock.
- **Детализация счетов**: Учет входных, выходных, кэшированных входных токенов, токенов рассуждения (reasoning/thinking) и других единиц (изображения, вызовы поиска).
- **Локальное хранилище**: Логирование всех транзакций в локальную базу данных SQLite (`.agent/data/llm_billing.sqlite3`).
- **Контроль бюджета**: Возвращает общие итоги за день в ответе, позволяя агентам останавливаться при превышении лимитов.

## Использование

Основной точкой входа является `scripts/track.py`. Он принимает событие в формате JSON через `stdin` или путь к файлу.

### 1. Отслеживание вызова

**Команда:**
```bash
python scripts/track.py --stdin
```

**Ввод (JSON через stdin):**
```json
{
  "provider": "openai",
  "model": "gpt-4o",
  "project": "my-app",
  "feature": "translation",
  "usage_raw": {
    "prompt_tokens": 150,
    "completion_tokens": 50,
    "total_tokens": 200
  }
}
```

**Вывод (JSON):**
```json
{
  "status": "logged",
  "transaction": {
    "cost_usd": 0.00045,
    "input_tokens": 150,
    "output_tokens": 50
  },
  "totals": {
    "daily_cost_usd": 0.12,
    "daily_tokens_total": 50000
  }
}
```

### 2. Генерация отчета

**Команда:**
```bash
python scripts/report.py --period day --date 2025-02-14
```

## Конфигурация

- **Реестр цен (Pricing Registry)**: Находится по адресу `resources/pricing_registry.json`. Обновите этот файл для изменения тарифов.
- **База данных**: По умолчанию используется `.agent/data/llm_billing.sqlite3`. Используйте переменную окружения `LLM_BILLING_DB_PATH` для переопределения пути.
