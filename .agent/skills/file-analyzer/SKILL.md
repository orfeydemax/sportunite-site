---
name: file-analyzer
description: Анализ файловой системы и создание дашборда. Используй этот скилл когда нужно проанализировать состав файлов в директории, узнать сколько места занимают файлы разных типов, или создать отчёт по файлам.
---

# File Analyzer

Скилл для анализа файловой структуры и генерации визуальных отчётов.

## Workflow

1. **Запрос пути**:
   - Если пользователь не указал путь, спроси: "Какую папку просканировать?"
   - Можно сканировать текущую папку (`.`) или любой абсолютный путь.

2. **Сканирование**:
   - Запусти `scripts/scan.ps1 -Path <path>`
   - Скрипт рекурсивно обойдёт файлы.
   - Сгруппирует файлы по категориям (Images, Video, Audio, Documents, Code, Archives, Other).

3. **Генерация отчёта**:
   - Скрипт автоматически создаст `report.html` в папке запуска.
   - Отчёт содержит Donut Chart (Chart.js) и таблицу детализации.

4. **Результат**:
   - Сообщи пользователю, что отчёт готов.
   - Предложи открыть его: `Start-Process report.html` (или пользователь откроет сам).

## Categories

- **Images**: jpg, jpeg, png, gif, bmp, svg, webp, ico, tif, tiff, psd
- **Video**: mp4, mov, avi, mkv, wmv, flv, webm
- **Audio**: mp3, wav, flac, aac, ogg, wma
- **Documents**: pdf, doc, docx, xls, xlsx, ppt, pptx, txt, rtf, md, csv
- **Code**: html, css, js, ts, py, java, c, cpp, cs, php, json, xml, yml, yaml, sql, sh, bat, ps1
- **Archives**: zip, rar, 7z, tar, gz
- **System**: exe, dll, sys, ini, db
