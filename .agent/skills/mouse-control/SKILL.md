---
name: mouse-control
description: Управление курсором мыши для выполнения движений, таких как рисование фигур (например, восьмерки).
---

# Навык управления мышью (Mouse Control)

Этот навык позволяет агенту управлять курсором мыши на экране пользователя.

## Возможности

- **Рисование фигур**: перемещение мыши по определенным шаблонам (например, восьмерка, круг).
- **Перемещение по координатам**: перемещение мыши в определенные координаты X,Y.

## Использование

Используйте инструмент `run_command` для выполнения скриптов PowerShell в `scripts/`.

### Нарисовать восьмерку
Чтобы нарисовать восьмерку (вертикальную):
```powershell
powershell -ExecutionPolicy Bypass -File ".agent/skills/mouse-control/scripts/draw8.ps1"
```

Аргументы:
- `-Loops <int>`: количество повторений (по умолчанию: 3).
- `-Speed <int>`: задержка в мс между движениями (по умолчанию: 10). Чем меньше, тем быстрее.
- `-Radius <int>`: размер фигуры в пикселях (по умолчанию: 100).

### Свернуть окно
Чтобы свернуть активное окно (нажимает кнопку сворачивания в правом верхнем углу):
```powershell
powershell -ExecutionPolicy Bypass -File ".agent/skills/mouse-control/scripts/minimize.ps1"
```
**Примечание:** предполагается, что окно развернуто на весь экран. Нажимает на `ScreenWidth - 110px`.

### Открыть URL
Чтобы открыть веб-сайт (имитирует механизм ввода):
```powershell
powershell -ExecutionPolicy Bypass -File ".agent/skills/mouse-control/scripts/open-url.ps1" -Url "example.com"
```
**Предварительное условие:** в идеале сначала переключитесь на окно браузера. Или используйте `Start-Process chrome` самостоятельно.

### Поиск в браузере
Чтобы найти что-то (открывает новую вкладку через Ctrl+T):
```powershell
powershell -ExecutionPolicy Bypass -File ".agent/skills/mouse-control/scripts/search.ps1" -Query "запрос для поиска"
```

### Пример полного рабочего процесса
Сворачивает текущее окно, открывает Chrome, нажимает на адресную строку и вводит URL:
```powershell
powershell -ExecutionPolicy Bypass -File ".agent/skills/mouse-control/scripts/full-workflow.ps1" -Url "example.com"
```

### Нажать на элемент UI (экспериментально)
Пытается найти кнопку/ссылку по ее доступному имени (тексту) и нажать на нее.
**Примечание:** это «слепой» поиск через Accessibility API. Он может быть медленным или давать сбои в нестандартных приложениях.
```powershell
powershell -ExecutionPolicy Bypass -File ".agent/skills/mouse-control/scripts/click-by-text.ps1" -Name "Пуск"
```
