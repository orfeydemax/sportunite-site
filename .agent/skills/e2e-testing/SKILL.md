---
name: e2e-testing
description: >-
  Паттерны сквозного (E2E) тестирования с использованием Playwright для фуллстек приложений на Python/React.
  Используйте при написании E2E тестов для полных рабочих процессов пользователя (вход, CRUD, навигация),
  регрессионных тестов критических путей или проверки в разных браузерах. Охватывает структуру тестов,
  модель объектов страниц (POM), стратегию селекторов (data-testid > role > label), стратегии ожидания,
  повторное использование состояния аутентификации, управление тестовыми данными и интеграцию с CI. НЕ охватывает модульные тесты
  или тесты компонентов (используйте pytest-patterns или react-testing-patterns).
license: MIT
compatibility: 'Playwright 1.40+, Node.js 20+'
metadata:
  author: platform-team
  version: '1.0.0'
  sdlc-phase: testing
allowed-tools: Read Edit Write Bash(npx:*) Bash(npm:*)
context: fork
---

# E2E Тестирование

## Когда использовать

Активируйте этот навык при:
- Написании E2E тестов для полных рабочих процессов пользователя (вход, операции CRUD, многостраничные сценарии).
- Создании регрессионных тестов критических путей, проверяющих весь стек целиком.
- Тестировании совместимости с различными браузерами (Chromium, Firefox, WebKit).
- Проверке процессов аутентификации от начала до конца.
- Тестировании сценариев загрузки и скачивания файлов.
- Написании дымовых тестов (smoke tests) для проверки деплоя.

НЕ используйте этот навык для:
- Модульных тестов компонентов React (используйте `react-testing-patterns`).
- Модульных/интеграционных тестов бэкенда на Python (используйте `pytest-patterns`).
- Обеспечения рабочего процесса TDD (используйте `tdd-workflow`).
- Тестирования API-контрактов без браузера (используйте `pytest-patterns` с httpx).

## Инструкции

### Структура тестов

```
e2e/
├── playwright.config.ts         # Глобальная конфигурация Playwright
├── fixtures/
│   ├── auth.fixture.ts          # Настройка состояния аутентификации
│   └── test-data.fixture.ts     # Создание/очистка тестовых данных
├── pages/
│   ├── base.page.ts             # Базовый объект страницы с общими методами
│   ├── login.page.ts            # Объект страницы входа
│   ├── users.page.ts            # Объект страницы списка пользователей
│   └── user-detail.page.ts      # Объект страницы деталей пользователя
├── tests/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   └── logout.spec.ts
│   ├── users/
│   │   ├── create-user.spec.ts
│   │   ├── edit-user.spec.ts
│   │   └── list-users.spec.ts
│   └── smoke/
│       └── critical-paths.spec.ts
└── utils/
    ├── api-helpers.ts           # Прямые вызовы API для настройки тестов
    └── test-constants.ts        # Общие константы
```

**Соглашения об именовании:**
- Файлы тестов: `<feature>.spec.ts`
- Объекты страниц: `<page-name>.page.ts`
- Фикстуры: `<concern>.fixture.ts`
- Названия тестов: читаемые предложения, описывающие действие пользователя и ожидаемый результат.

### Модель объектов страниц (Page Object Model)

Для каждой страницы создается класс объекта страницы, который инкапсулирует селекторы и действия. Тесты никогда не взаимодействуют с селекторами напрямую.

**Базовый объект страницы:**
```typescript
// e2e/pages/base.page.ts
import { type Page, type Locator } from "@playwright/test";

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Перейти на URL страницы. */
  abstract goto(): Promise<void>;

  /** Ожидание полной загрузки страницы. */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  /** Получить всплывающее уведомление (toast). */
  get toast(): Locator {
    return this.page.getByRole("alert");
  }

  /** Получить заголовок страницы. */
  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }
}
```

**Конкретный объект страницы:**
```typescript
// e2e/pages/users.page.ts
import { type Page, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

export class UsersPage extends BasePage {
  // ─── Локаторы ─────────────────────────────────────────
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly userTable: Locator;

  constructor(page: Page) {
    super(page);
    this.createButton = page.getByTestId("create-user-btn");
    this.searchInput = page.getByRole("searchbox", { name: /search users/i });
    this.userTable = page.getByRole("table");
  }

  // ─── Действия ──────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto("/users");
    await this.waitForLoad();
  }

  async searchFor(query: string): Promise<void> {
    await this.searchInput.fill(query);
    // Ожидание обновления результатов поиска (debounced)
    await this.page.waitForResponse("**/api/v1/users?*");
  }

  async clickCreateUser(): Promise<void> {
    await this.createButton.click();
  }

  async getUserRow(email: string): Promise<Locator> {
    return this.userTable.getByRole("row").filter({ hasText: email });
  }

  async getUserCount(): Promise<number> {
    // Вычитаем 1 для строки заголовка
    return (await this.userTable.getByRole("row").count()) - 1;
  }
}
```

**Правила для объектов страниц:**
- Один объект страницы на одну страницу или крупный раздел UI.
- Локаторы — это публичные свойства `readonly`.
- Действия — это асинхронные методы (async).
- Объекты страниц никогда не содержат утверждений (assertions) — утверждения делаются в тестах.
- Объекты страниц обрабатывают ожидания внутри методов после выполнения действий.

### Стратегия селекторов

**Приоритетный порядок (от высшего к низшему):**

| Приоритет | Селектор | Пример | Когда использовать |
|----------|----------|---------|-------------|
| 1 | `data-testid` | `getByTestId("submit-btn")` | Интерактивные элементы, динамический контент |
| 2 | Роль (Role) | `getByRole("button", { name: /save/i })` | Кнопки, ссылки, заголовки, инпуты |
| 3 | Метка (Label) | `getByLabel("Email")` | Поля ввода форм с метками |
| 4 | Плейсхолдер | `getByPlaceholder("Search...")` | Инпуты поиска |
| 5 | Текст | `getByText("Welcome back")` | Статический текстовый контент |

**НИКОГДА не используйте:**
- CSS-селекторы (`.class-name`, `#id`) — хрупкие, ломаются при изменении стилей.
- XPath (`//div[@class="foo"]`) — нечитаемо, крайне хрупко.
- Селекторы структуры DOM (`div > span:nth-child(2)`) — ломаются при изменении верстки.

**Добавление атрибутов data-testid:**
```tsx
// В React компонентах — добавляйте data-testid к интерактивным элементам
<button data-testid="create-user-btn" onClick={handleCreate}>
  Create User
</button>

// Соглашение: kebab-case, описательное название
// Шаблон: <действие>-<сущность>-<тип-элемента>
// Примеры: create-user-btn, user-email-input, delete-confirm-dialog
```

### Стратегии ожидания

**НИКОГДА не используйте жестко заданные ожидания (hardcoded waits):**
```typescript
// ПЛОХО: Жесткое ожидание — нестабильно, медленно
await page.waitForTimeout(3000);

// ПЛОХО: Sleep
await new Promise((resolve) => setTimeout(resolve, 2000));
```

**Используйте явные условия ожидания:**
```typescript
// ХОРОШО: Ожидание появления конкретного элемента
await page.getByRole("heading", { name: "Dashboard" }).waitFor();

// ХОРОШО: Ожидание перехода по URL
await page.waitForURL("/dashboard");

// ХОРОШО: Ожидание ответа API
await page.waitForResponse(
  (response) =>
    response.url().includes("/api/v1/users") && response.status() === 200,
);

// ХОРОШО: Ожидание завершения сетевой активности
await page.waitForLoadState("networkidle");

// ХОРОШО: Ожидание состояния элемента
await page.getByTestId("submit-btn").waitFor({ state: "visible" });
await page.getByTestId("loading-spinner").waitFor({ state: "hidden" });
```

**Авто-ожидание:** Playwright автоматически ожидает готовности элементов перед кликом, вводом текста и т.д. Явные ожидания нужны только для утверждений или сложных переходов состояний.

### Повторное использование состояния аутентификации

Избегайте процесса входа перед каждым тестом. Сохраняйте состояние аутентификации и используйте его повторно.

**Настройте состояние аутентификации один раз:**
```typescript
// e2e/fixtures/auth.fixture.ts
import { test as base } from "@playwright/test";
import path from "path";

const AUTH_STATE_PATH = path.resolve("e2e/.auth/user.json");

export const setup = base.extend({});

setup("authenticate", async ({ page }) => {
  // Выполнение реального входа
  await page.goto("/login");
  await page.getByLabel("Email").fill("testuser@example.com");
  await page.getByLabel("Password").fill("TestPassword123!");
  await page.getByRole("button", { name: /sign in/i }).click();

  // Ожидание завершения входа
  await page.waitForURL("/dashboard");

  // Сохранение состояния авторизации
  await page.context().storageState({ path: AUTH_STATE_PATH });
});
```

**Повторное использование в тестах:**
```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    // Настроечный проект запускается первым и сохраняет состояние аутентификации
    { name: "setup", testDir: "./e2e/fixtures", testMatch: "auth.fixture.ts" },
    {
      name: "chromium",
      use: {
        storageState: "e2e/.auth/user.json",  // Повторное использование состояния
      },
      dependencies: ["setup"],
    },
  ],
});
```

### Управление тестовыми данными

**Принципы:**
- Тесты сами создают свои данные (никогда не зависят от уже существующих данных).
- Тесты сами убирают за собой (или используют API для сброса).
- Используйте вызовы API для настройки, а не взаимодействия с UI (быстрее, надежнее).

**API-помощники для тестовых данных:**
```typescript
// e2e/utils/api-helpers.ts
import { type APIRequestContext } from "@playwright/test";

export class TestDataAPI {
  constructor(private request: APIRequestContext) {}

  async createUser(data: { email: string; displayName: string }) {
    const response = await this.request.post("/api/v1/users", { data });
    return response.json();
  }

  async deleteUser(userId: number) {
    await this.request.delete(`/api/v1/users/${userId}`);
  }

  async createOrder(userId: number, items: Array<Record<string, unknown>>) {
    const response = await this.request.post("/api/v1/orders", {
      data: { user_id: userId, items },
    });
    return response.json();
  }
}
```

**Использование в тестах:**
```typescript
test("edit user name", async ({ page, request }) => {
  const api = new TestDataAPI(request);

  // Setup: создание пользователя через API (быстро)
  const user = await api.createUser({
    email: "edit-test@example.com",
    displayName: "Before Edit",
  });

  try {
    // Тест: редактирование через UI
    const usersPage = new UsersPage(page);
    await usersPage.goto();
    // ... выполнение редактирования через UI ...
  } finally {
    // Очистка: удаление тестовых данных
    await api.deleteUser(user.id);
  }
});
```

### Отладка нестабильных (flaky) тестов

**1. Используйте Trace Viewer для ошибок:**
```typescript
// playwright.config.ts
use: {
  trace: "on-first-retry",  // Захват трассировки только при повторе
}
```

Просмотр трассировки: `npx playwright show-trace trace.zip`

**2. Запуск в режиме с интерфейсом для отладки:**
```bash
npx playwright test --headed --debug tests/users/create-user.spec.ts
```

**3. Общие причины нестабильности тестов:**
| Причина | Решение |
|-------|-----|
| Жесткие ожидания | Используйте явные условия ожидания |
| Общие тестовые данные | Каждый тест создает свои собственные данные |
| Помехи от анимации | Установите `animations: "disabled"` в конфиге |
| Состояние гонки (Race conditions) | Ожидайте ответов API перед утверждениями |
| Поведение, зависящее от вьюпорта | Установите фиксированный вьюпорт в конфиге |
| Утечки сессий между тестами | Правильно используйте `storageState`, очищайте куки |

**4. Стратегия повторов:**
```typescript
// playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 2 : 0,  // Повторы только в CI
});
```

### Настройка CI

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Start application
        run: |
          docker compose up -d
          npx wait-on http://localhost:3000 --timeout 60000

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14

      - name: Upload traces on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-traces
          path: test-results/
```

Используйте `scripts/run-e2e-with-report.sh` для локального запуска Playwright с генерацией HTML-отчета.

## Примеры

См. `references/page-object-template.ts` для аннотированного шаблона класса объекта страницы.
См. `references/e2e-test-template.ts` для аннотированного шаблона E2E теста.
См. `references/playwright-config-example.ts` для примера конфигурации Playwright для продакшена.
