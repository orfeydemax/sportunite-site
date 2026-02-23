---
name: bats-testing-patterns
description: Освойте Bash Automated Testing System (Bats) для всестороннего тестирования shell-скриптов. Используйте при написании тестов для shell-скриптов, конвейеров CI/CD или при необходимости разработки через тестирование (TDD) для системных утилит.
---

# Паттерны тестирования Bats

Подробное руководство по написанию комплексных модульных тестов для shell-скриптов с использованием Bats (Bash Automated Testing System), включая паттерны тестов, фикстуры и лучшие практики для промышленного тестирования оболочки.

## Когда использовать этот навык

- Написание модульных тестов для shell-скриптов.
- Реализация разработки через тестирование (TDD) для скриптов.
- Настройка автоматизированного тестирования в конвейерах CI/CD.
- Тестирование граничных случаев и условий ошибок.
- Проверка поведения в различных средах оболочки.
- Создание поддерживаемых тестовых наборов для скриптов.
- Создание фикстур для сложных тестовых сценариев.
- Тестирование различных диалектов оболочки (bash, sh, dash).

## Основы Bats

### Что такое Bats?

Bats (Bash Automated Testing System) — это среда тестирования для shell-скриптов, совместимая с протоколом TAP (Test Anything Protocol), которая обеспечивает:

- Простой и естественный синтаксис тестов.
- Формат вывода TAP, совместимый с системами CI.
- Поддержку фикстур и функций setup/teardown.
- Вспомогательные функции для утверждений (assertions).
- Параллельное выполнение тестов.

### Установка

```bash
# macOS с Homebrew
brew install bats-core

# Ubuntu/Debian
git clone https://github.com/bats-core/bats-core.git
cd bats-core
./install.sh /usr/local

# Через npm (Node.js)
npm install --global bats

# Проверка установки
bats --version
```

### Структура файлов

```
project/
├── bin/
│   ├── script.sh
│   └── helper.sh
├── tests/
│   ├── test_script.bats
│   ├── test_helper.sh
│   ├── fixtures/
│   │   ├── input.txt
│   │   └── expected_output.txt
│   └── helpers/
│       └── mocks.bash
└── README.md
```

## Базовая структура теста

### Простой тестовый файл

```bash
#!/usr/bin/env bats

# Загрузка тестового помощника, если он есть
load test_helper

# setup запускается перед каждым тестом
setup() {
    export TMPDIR=$(mktemp -d)
}

# teardown запускается после каждого теста
teardown() {
    rm -rf "$TMPDIR"
}

# Тест: простое утверждение
@test "Функция возвращает 0 при успехе" {
    run my_function "input"
    [ "$status" -eq 0 ]
}

# Тест: проверка вывода
@test "Функция выводит правильный результат" {
    run my_function "test"
    [ "$output" = "expected output" ]
}

# Тест: обработка ошибок
@test "Функция возвращает 1 при отсутствии аргумента" {
    run my_function
    [ "$status" -eq 1 ]
}
```

## Паттерны утверждений (Assertion Patterns)

### Утверждения кода выхода (Exit Code)

```bash
#!/usr/bin/env bats

@test "Команда завершается успешно" {
    run true
    [ "$status" -eq 0 ]
}

@test "Команда завершается с ошибкой, как и ожидалось" {
    run false
    [ "$status" -ne 0 ]
}

@test "Команда возвращает конкретный код выхода" {
    run my_function --invalid
    [ "$status" -eq 127 ]
}

@test "Можно захватить результат команды" {
    run echo "hello"
    [ $status -eq 0 ]
    [ "$output" = "hello" ]
}
```

### Утверждения вывода (Output)

```bash
#!/usr/bin/env bats

@test "Вывод совпадает со строкой" {
    result=$(echo "hello world")
    [ "$result" = "hello world" ]
}

@test "Вывод содержит подстроку" {
    result=$(echo "hello world")
    [[ "$result" == *"world"* ]]
}

@test "Вывод соответствует шаблону" {
    result=$(date +%Y)
    [[ "$result" =~ ^[0-9]{4}$ ]]
}

@test "Многострочный вывод" {
    run printf "line1\nline2\nline3"
    [ "$output" = "line1
line2
line3" ]
}

@test "Переменная lines содержит вывод" {
    run printf "line1\nline2\nline3"
    [ "${lines[0]}" = "line1" ]
    [ "${lines[1]}" = "line2" ]
    [ "${lines[2]}" = "line3" ]
}
```

### Утверждения файлов (File Assertions)

```bash
#!/usr/bin/env bats

@test "Файл создан" {
    [ ! -f "$TMPDIR/output.txt" ]
    my_function > "$TMPDIR/output.txt"
    [ -f "$TMPDIR/output.txt" ]
}

@test "Содержимое файла соответствует ожидаемому" {
    my_function > "$TMPDIR/output.txt"
    [ "$(cat "$TMPDIR/output.txt")" = "expected content" ]
}

@test "Файл доступен для чтения" {
    touch "$TMPDIR/test.txt"
    [ -r "$TMPDIR/test.txt" ]
}

@test "Файл имеет правильные права доступа" {
    touch "$TMPDIR/test.txt"
    chmod 644 "$TMPDIR/test.txt"
    [ "$(stat -f %OLp "$TMPDIR/test.txt")" = "644" ]
}

@test "Размер файла правильный" {
    echo -n "12345" > "$TMPDIR/test.txt"
    [ "$(wc -c < "$TMPDIR/test.txt")" -eq 5 ]
}
```

## Паттерны настройки и очистки (Setup/Teardown)

### Базовые Setup и Teardown

```bash
#!/usr/bin/env bats

setup() {
    # Создание тестовой директории
    TEST_DIR=$(mktemp -d)
    export TEST_DIR

    # Подключение тестируемого скрипта
    source "${BATS_TEST_DIRNAME}/../bin/script.sh"
}

teardown() {
    # Удаление временной директории
    rm -rf "$TEST_DIR"
}

@test "Тест с использованием TEST_DIR" {
    touch "$TEST_DIR/file.txt"
    [ -f "$TEST_DIR/file.txt" ]
}
```

### Setup с ресурсами

```bash
#!/usr/bin/env bats

setup() {
    # Создание структуры директорий
    mkdir -p "$TMPDIR/data/input"
    mkdir -p "$TMPDIR/data/output"

    # Создание тестовых фикстур
    echo "line1" > "$TMPDIR/data/input/file1.txt"
    echo "line2" > "$TMPDIR/data/input/file2.txt"

    # Инициализация окружения
    export DATA_DIR="$TMPDIR/data"
    export INPUT_DIR="$DATA_DIR/input"
    export OUTPUT_DIR="$DATA_DIR/output"
}

teardown() {
    rm -rf "$TMPDIR/data"
}

@test "Обрабатывает входные файлы" {
    run my_process_script "$INPUT_DIR" "$OUTPUT_DIR"
    [ "$status" -eq 0 ]
    [ -f "$OUTPUT_DIR/file1.txt" ]
}
```

### Глобальные Setup/Teardown

```bash
#!/usr/bin/env bats

# Загрузка общего setup из test_helper.sh
load test_helper

# setup_file запускается один раз перед всеми тестами
setup_file() {
    export SHARED_RESOURCE=$(mktemp -d)
    echo "Expensive setup" > "$SHARED_RESOURCE/data.txt"
}

# teardown_file запускается один раз после всех тестов
teardown_file() {
    rm -rf "$SHARED_RESOURCE"
}

@test "Первый тест использует общий ресурс" {
    [ -f "$SHARED_RESOURCE/data.txt" ]
}

@test "Второй тест использует общий ресурс" {
    [ -d "$SHARED_RESOURCE" ]
}
```

## Паттерны мокинга и стаббинга

### Мокинг функций (Function Mocking)

```bash
#!/usr/bin/env bats

# Мок внешней команды
my_external_tool() {
    echo "mocked output"
    return 0
}

@test "Функция использует мок инструмента" {
    export -f my_external_tool
    run my_function
    [[ "$output" == *"mocked output"* ]]
}
```

### Стаббинг команд (Command Stubbing)

```bash
#!/usr/bin/env bats

setup() {
    # Создание директории для стабов
    STUBS_DIR="$TMPDIR/stubs"
    mkdir -p "$STUBS_DIR"

    # Добавление в PATH
    export PATH="$STUBS_DIR:$PATH"
}

create_stub() {
    local cmd="$1"
    local output="$2"
    local code="${3:-0}"

    cat > "$STUBS_DIR/$cmd" <<EOF
#!/bin/bash
echo "$output"
exit $code
EOF
    chmod +x "$STUBS_DIR/$cmd"
}

@test "Функция работает со стабом curl" {
    create_stub curl "{ \"status\": \"ok\" }" 0
    run my_api_function
    [ "$status" -eq 0 ]
}
```

### Стаббинг переменных

```bash
#!/usr/bin/env bats

@test "Функция обрабатывает переопределение переменной окружения" {
    export MY_SETTING="override_value"
    run my_function
    [ "$status" -eq 0 ]
    [[ "$output" == *"override_value"* ]]
}

@test "Функция использует значение по умолчанию, если переменная не задана" {
    unset MY_SETTING
    run my_function
    [ "$status" -eq 0 ]
    [[ "$output" == *"default"* ]]
}
```

## Управление фикстурами (Fixture Management)

### Использование файлов-фикстур

```bash
#!/usr/bin/env bats

# Директория фикстур: tests/fixtures/

setup() {
    FIXTURES_DIR="${BATS_TEST_DIRNAME}/fixtures"
    WORK_DIR=$(mktemp -d)
    export WORK_DIR
}

teardown() {
    rm -rf "$WORK_DIR"
}

@test "Обработка файла-фикстуры" {
    # Копирование фикстуры в рабочую директорию
    cp "$FIXTURES_DIR/input.txt" "$WORK_DIR/input.txt"

    # Запуск функции
    run my_process_function "$WORK_DIR/input.txt"

    # Сравнение вывода
    diff "$WORK_DIR/output.txt" "$FIXTURES_DIR/expected_output.txt"
}
```

### Динамическая генерация фикстур

```bash
#!/usr/bin/env bats

generate_fixture() {
    local lines="$1"
    local file="$2"

    for i in $(seq 1 "$lines"); do
        echo "Line $i content" >> "$file"
    done
}

@test "Обработка большого входного файла" {
    generate_fixture 1000 "$TMPDIR/large.txt"
    run my_function "$TMPDIR/large.txt"
    [ "$status" -eq 0 ]
    [ "$(wc -l < "$TMPDIR/large.txt")" -eq 1000 ]
}
```

## Продвинутые паттерны

### Тестирование условий ошибок

```bash
#!/usr/bin/env bats

@test "Функция завершается ошибкой при отсутствии файла" {
    run my_function "/nonexistent/file.txt"
    [ "$status" -ne 0 ]
    [[ "$output" == *"not found"* ]]
}

@test "Функция завершается ошибкой при некорректном вводе" {
    run my_function ""
    [ "$status" -ne 0 ]
}

@test "Функция завершается ошибкой при отсутствии прав доступа" {
    touch "$TMPDIR/readonly.txt"
    chmod 000 "$TMPDIR/readonly.txt"
    run my_function "$TMPDIR/readonly.txt"
    [ "$status" -ne 0 ]
    chmod 644 "$TMPDIR/readonly.txt"  # Очистка
}

@test "Функция выводит полезное сообщение об ошибке" {
    run my_function --invalid-option
    [ "$status" -ne 0 ]
    [[ "$output" == *"Usage:"* ]]
}
```

### Тестирование с зависимостями

```bash
#!/usr/bin/env bats

setup() {
    # Проверка обязательных инструментов
    if ! command -v jq &>/dev/null; then
        skip "jq не установлен"
    fi

    export SCRIPT="${BATS_TEST_DIRNAME}/../bin/script.sh"
}

@test "Парсинг JSON работает" {
    run my_json_parser '{"key": "value"}'
    [ "$status" -eq 0 ]
}
```

### Тестирование совместимости оболочек

```bash
#!/usr/bin/env bats

@test "Скрипт работает в bash" {
    bash "${BATS_TEST_DIRNAME}/../bin/script.sh" arg1
}

@test "Скрипт работает в sh (POSIX)" {
    sh "${BATS_TEST_DIRNAME}/../bin/script.sh" arg1
}

@test "Скрипт работает в dash" {
    if command -v dash &>/dev/null; then
        dash "${BATS_TEST_DIRNAME}/../bin/script.sh" arg1
    else
        skip "dash не установлен"
    fi
}
```

### Параллельное выполнение

```bash
#!/usr/bin/env bats

@test "Несколько независимых операций" {
    run bash -c 'for i in {1..10}; do
        my_operation "$i" &
    done
    wait'
    [ "$status" -eq 0 ]
}

@test "Конкурентные операции с файлами" {
    for i in {1..5}; do
        my_function "$TMPDIR/file$i" &
    done
    wait
    [ -f "$TMPDIR/file1" ]
    [ -f "$TMPDIR/file5" ]
}
```

## Паттерн тестового помощника (Test Helper)

### test_helper.sh

```bash
#!/usr/bin/env bash

# Путь к тестируемым скриптам
export SCRIPT_DIR="${BATS_TEST_DIRNAME%/*}/bin"

# Общие утилиты для тестов
assert_file_exists() {
    if [ ! -f "$1" ]; then
        echo "Ожидалось появление файла: $1"
        return 1
    fi
}

assert_file_equals() {
    local file="$1"
    local expected="$2"

    if [ ! -f "$file" ]; then
        echo "Файл не существует: $file"
        return 1
    fi

    local actual=$(cat "$file")
    if [ "$actual" != "$expected" ]; then
        echo "Содержимое файла не совпадает"
        echo "Ожидалось: $expected"
        echo "Фактически: $actual"
        return 1
    fi
}

# Создание временной тестовой директории
setup_test_dir() {
    export TEST_DIR=$(mktemp -d)
}

cleanup_test_dir() {
    rm -rf "$TEST_DIR"
}
```

## Интеграция с CI/CD

### Workflow GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Install Bats
        run: |
          npm install --global bats

      - name: Run Tests
        run: |
          bats tests/*.bats

      - name: Run Tests with Tap Reporter
        run: |
          bats tests/*.bats --tap | tee test_output.tap
```

### Интеграция с Makefile

```makefile
.PHONY: test test-verbose test-tap

test:
	bats tests/*.bats

test-verbose:
	bats tests/*.bats --verbose

test-tap:
	bats tests/*.bats --tap

test-parallel:
	bats tests/*.bats --parallel 4

coverage: test
	# Опционально: генерация отчетов о покрытии
```

## Лучшие практики

1. **Один тест — одна проверка** — принцип единственной ответственности.
2. **Используйте описательные названия тестов** — четко указывайте, что проверяется.
3. **Очистка после тестов** — всегда удаляйте временные файлы в teardown.
4. **Тестируйте как успешные, так и ошибочные пути** — не ограничивайтесь только «happy path».
5. **Мокайте внешние зависимости** — изолируйте тестируемый модуль.
6. **Используйте фикстуры для сложных данных** — это делает тесты более читаемыми.
7. **Запускайте тесты в CI/CD** — находите регрессии как можно раньше.
8. **Тестируйте на разных диалектах оболочки** — обеспечивайте переносимость.
9. **Поддерживайте высокую скорость тестов** — запускайте их параллельно, где возможно.
10. **Документируйте сложную настройку тестов** — объясняйте необычные паттерны.

## Ресурсы

- **Bats GitHub**: https://github.com/bats-core/bats-core
- **Документация Bats**: https://bats-core.readthedocs.io/
- **Протокол TAP**: https://testanything.org/
- **Разработка через тестирование (TDD)**: https://en.wikipedia.org/wiki/Test-driven_development
