---
name: facebook
description: "Интеграция с Facebook для управления социальными сетями. Используйте, когда вам нужно: (1) публиковать обновления на страницах Facebook, (2) делиться контентом и медиафайлами или (3) автоматизировать рабочие процессы страниц Facebook."
version: 1.0.0
skillId: skp-ary4qi0tx153f8ms8iwsxsmr
workflowId: c-opg0f8e7j3m1fmjhjakmhpfk
installationId: skpi-nyozn1z7255wdo122km3efhb
category: action
---

# Facebook

Интеграция с Facebook для управления социальными сетями. Используйте, когда вам нужно: (1) публиковать обновления на страницах Facebook, (2) делиться контентом и медиафайлами или (3) автоматизировать рабочие процессы страниц Facebook.

## Входные данные

Предоставьте входные данные в формате JSON:

```json
{
  "post_content": "Текст вашего поста в Facebook",
  "page_id": "ID вашей страницы Facebook (необязательно, оставьте пустым для публикации в личный профиль)",
  "post_type": "Тип поста: status, photo, video, или link"
}
```

## Выполнение (Паттерн C: Действие)

### Шаг 1: Запуск навыка и получение Run ID

```bash
RESULT=$(refly skill run --id skpi-nyozn1z7255wdo122km3efhb --input '{
  "page_id": "your-page-id",
  "message": "Ознакомьтесь с нашим последним обновлением продукта!"
}')
RUN_ID=$(echo "$RESULT" | jq -r '.payload.workflowExecutions[0].id')
# RUN_ID имеет формат we-xxx, используйте его для команд воркфлоу
```

### Шаг 2: Открытие рабочего процесса в браузере и ожидание завершения

```bash
open "https://refly.ai/workflow/c-opg0f8e7j3m1fmjhjakmhpfk"
refly workflow status "$RUN_ID" --watch --interval 30000
```

### Шаг 3: Подтверждение статуса действия

```bash
# Подтверждение публикации поста
STATUS=$(refly workflow detail "$RUN_ID" | jq -r '.payload.status')
echo "Действие завершено со статусом: $STATUS"
```

## Ожидаемый результат

- **Тип**: Ответ API
- **Формат**: JSON подтверждение поста (ID поста, ссылка)
- **Действие**: Подтверждение успешной публикации поста

## Правила

Следуйте базовому рабочему процессу навыков: `~/.claude/skills/refly/SKILL.md`
