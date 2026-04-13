# Модуль vault_supabase — Загрузка секретов из Supabase Vault

## Что это

Готовый модуль для загрузки секретов (API-ключи, токены) из Supabase Vault в `os.environ` при старте приложения. Копируется в любой Python-проект.

## Содержимое папки

| Файл | Назначение |
|---|---|
| `vault_loader.py` | Python-модуль — копировать в `src/` проекта |
| `setup.sql` | SQL-функция — выполнить один раз на Supabase сервере |
| `README.md` | Эта инструкция |

---

## Быстрый старт (для ИИ-агента и человека)

### Шаг 1. Скопируй `vault_loader.py` в `src/` нового проекта

### Шаг 2. Заполни маппинг в конце файла

```python
VAULT_SECRETS_MAP = {
    "ИМЯ_В_VAULT": "ИМЯ_В_ПРИЛОЖЕНИИ",
    # Пример:
    "TELEGRAM_BOT_TOKEN_2": "TELEGRAM_BOT_TOKEN",
    "GEMINI_API_KEY": "GEMINI_API_KEY",
}
```

- **Ключ** = имя секрета в Supabase Vault (Dashboard → Settings → Vault)
- **Значение** = имя переменной, которое ожидает приложение через `os.getenv()`

### Шаг 3. Добавь bootstrap-переменные в `.env`

```env
SUPABASE_URL=https://supabase.mvprofi.org
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiI...
```

> **⚠️ Не коммить `.env` в git!** Добавь в `.gitignore`.

### Шаг 4. Вызови загрузку ДО инициализации конфига

```python
# В config.py или main.py — самый верх
from src.vault_loader import load_secrets_to_env
load_secrets_to_env()

# Теперь os.getenv("GEMINI_API_KEY") вернёт реальное значение
```

Или с кастомным маппингом (без редактирования файла):

```python
load_secrets_to_env({
    "MY_SECRET": "MY_ENV_VAR",
    "OTHER_KEY": "OTHER_VAR",
})
```

### Шаг 5. Добавь `requests` в зависимости

```
requests
```

---

## SQL-функция (одноразовая настройка)

> Уже установлена на `supabase.mvprofi.org`. При переустановке Supabase — выполни `setup.sql`.

Как выполнить:
```bash
# Через Docker на сервере
sudo docker cp setup.sql supabase-db:/tmp/setup.sql
sudo docker exec supabase-db psql -U postgres -d postgres -f /tmp/setup.sql
```

---

## Где взять SERVICE_ROLE_KEY

На сервере `116.118.9.78`:
```bash
sudo grep SERVICE_ROLE_KEY /root/supabase-selfhost/.env
```

---

## Как добавить новый секрет

1. Supabase Dashboard → Settings → Vault → **Add new secret**
2. Укажи **Name** и **Value**
3. Добавь имя в `VAULT_SECRETS_MAP`
4. Перезапусти приложение

---

## Отладка

| Лог-сообщение | Причина |
|---|---|
| `SUPABASE_URL или ... не заданы` | Нет bootstrap-ключей в `.env` |
| `Ошибка загрузки секретов` | Неверный URL/ключ или сеть недоступна |
| `Ни один секрет не найден` | Имена в маппинге не совпадают с Vault |

Тест внутри Docker-контейнера:
```bash
docker exec <container> python -c "
import logging; logging.basicConfig(level=logging.INFO)
from src.vault_loader import load_secrets_to_env
load_secrets_to_env()
"
```
