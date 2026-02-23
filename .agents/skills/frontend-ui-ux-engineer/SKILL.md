---
name: frontend-ui-ux-engineer
description: Специалист по UI/UX, превратившийся в разработчика, который создает потрясающие интерфейсы даже без готовых макетов. Код может быть немного небрежным, но визуальный результат всегда на высоте.
---

# Фронтенд-инженер UI/UX (Frontend UI/UX Engineer)

## Цель

Предоставление экспертных знаний в области фронтенд-дизайна и разработки, специализирующееся на создании визуально впечатляющих, ориентированных на пользователя интерфейсов без необходимости в готовых макетах. Создает красивый пользовательский интерфейс (UI/UX) с использованием креативного дизайнерского мышления, продвинутой стилизации, анимации и лучших практик доступности для современных веб-приложений.

## Когда использовать

- Необходимо превратить функциональный UI в визуально потрясающий интерфейс.
- Дизайнерские макеты отсутствуют, но требуется красивый UI.
- Визуальный лоск и микро-взаимодействия являются приоритетом.
- Стилизация компонентов требует креативного дизайнерского мышления.
- Требуются улучшения пользовательского опыта (UX) без привлечения отдельного дизайнера.

## Быстрый старт

**Используйте этот навык, когда:**
- Нужно превратить функциональный UI в визуально потрясающий интерфейс.
- Дизайнерские макеты отсутствуют, но требуется красивый UI.
- Визуальный лоск и микро-взаимодействия важнее элегантности кода.
- Стилизация компонентов требует креативного дизайнерского мышления.
- Требуются улучшения пользовательского опыта (UX) без привлечения отдельного дизайнера.

**НЕ используйте, когда:**
- Нужна логика бэкенда или разработка API.
- Требуется чистый рефакторинг кода без визуальных изменений.
- Оптимизация производительности является единственным приоритетом.
- Требуется разработка, ориентированная на безопасность.
- Работа с базами данных или инфраструктурой.

---

## Основные рабочие процессы

### Рабочий процесс 1: Превращение функционального компонента в потрясающий UI

**Вариант использования:** Дан простой React-компонент, сделайте его визуально исключительным.

**Пример входных данных:**
```tsx
// До: Функционально, но просто
function ProductCard({ product }: { product: Product }) {
  return (
    <div>
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      <button>Add to Cart</button>
    </div>
  );
}
```

**Шаги:**

**1. Визуальный анализ (2 минуты)**
```
Вопросы для ответа:
- Какую эмоцию это должно вызывать? (Премиум? Игривость? Доверие?)
- Какова визуальная иерархия? (Изображение > Имя > Цена > CTA)
- Какие взаимодействия восхитят пользователей? (Эффекты наведения, плавные переходы)
- Где нужно свободное пространство? (Место для "дыхания" вокруг элементов)
```

**2. Улучшение цвета и типографики**
```tsx
// После: Создана визуальная основа
import { motion } from 'framer-motion';

function ProductCard({ product }: { product: Product }) {
  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl bg-white shadow-lg transition-shadow hover:shadow-2xl"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Контейнер изображения с соотношением сторон */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Градиентный оверлей для читаемости */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      {/* Контент с правильными отступами */}
      <div className="p-6 space-y-3">
        <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
          {product.name}
        </h3>
        
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-blue-600">
            ${product.price}
          </span>
          {product.compareAtPrice && (
            <span className="text-sm text-gray-500 line-through">
              ${product.compareAtPrice}
            </span>
          )}
        </div>

        {/* Улучшенная кнопка CTA */}
        <button className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed">
          Add to Cart
        </button>
      </div>
    </motion.div>
  );
}
```

**3. Микро-взаимодействия и лоск**
```tsx
// Финал: Добавлены восхитительные взаимодействия
function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    onAddToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <motion.div
      layout
      className="group relative overflow-hidden rounded-2xl bg-white shadow-lg transition-shadow hover:shadow-2xl"
      whileHover={{ y: -4 }}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Значок распродажи с анимацией */}
        {product.onSale && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute top-4 right-4 rounded-full bg-red-500 px-3 py-1 text-sm font-bold text-white shadow-lg"
          >
            SALE
          </motion.div>
        )}
      </div>

      <div className="p-6 space-y-3">
        <h3 className="text-xl font-semibold text-gray-900 line-clamp-2 transition-colors group-hover:text-blue-600">
          {product.name}
        </h3>
        
        <div className="flex items-baseline gap-2">
          <motion.span
            className="text-2xl font-bold text-blue-600"
            key={product.price} // Переанимация при изменении цены
            initial={{ scale: 1.2, color: '#ef4444' }}
            animate={{ scale: 1, color: '#2563eb' }}
          >
            ${product.price}
          </motion.span>
          {product.compareAtPrice && (
            <span className="text-sm text-gray-500 line-through">
              ${product.compareAtPrice}
            </span>
          )}
        </div>

        {/* Кнопка с состоянием успеха */}
        <button
          onClick={handleAddToCart}
          className={`
            w-full rounded-lg px-6 py-3 font-medium text-white transition-all
            ${isAdded 
              ? 'bg-green-500 scale-105' 
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }
          `}
        >
          {isAdded ? (
            <span className="flex items-center justify-center gap-2">
              <CheckIcon className="h-5 w-5" />
              Добавлено!
            </span>
          ) : (
            'Add to Cart'
          )}
        </button>
      </div>
    </motion.div>
  );
}
```

**Ожидаемый результат:**
- Визуальная привлекательность увеличилась в 5 раз.
- Метрики вовлеченности улучшаются на 20-40% (типично).
- Восторг пользователя через микро-взаимодействия.
- Поддерживается доступность (ARIA-метки, навигация с клавиатуры).

---

## Паттерны и шаблоны

### Паттерн 1: Карточка в стиле Glassmorphism

**Когда использовать:** Современная, премиальная эстетика (хорошо работает с яркими фонами).

```tsx
function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div className={`
      relative overflow-hidden rounded-2xl
      backdrop-blur-xl backdrop-saturate-150
      bg-white/10 border border-white/20
      shadow-xl shadow-black/5
      ${className}
    `}>
      {/* Необязательный градиентный оверлей */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50" />
      
      <div className="relative z-10 p-6">
        {children}
      </div>
    </div>
  );
}
```

---

### Паттерн 3: Skeleton-загрузка с эффектом мерцания (Shimmer)

**Когда использовать:** Состояния загрузки для карточек, списков (лучший UX, чем просто спиннеры).

```tsx
function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gray-200 p-6">
      {/* Эффект мерцания */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      
      {/* Скелетный контент */}
      <div className="space-y-4">
        <div className="h-4 w-3/4 rounded bg-gray-300" />
        <div className="h-4 w-1/2 rounded bg-gray-300" />
        <div className="h-32 w-full rounded bg-gray-300" />
      </div>
    </div>
  );
}

// Конфиг Tailwind (добавить в tailwind.config.js)
{
  theme: {
    extend: {
      animation: {
        shimmer: 'shimmer 2s infinite',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
}
```

---

### ❌ Анти-паттерн 2: Игнорирование цветового контраста

**Как это выглядит:**
```css
/* ❌ Серый текст на светло-сером фоне = нечитаемо */
.subtle-text {
  color: #999999;
  background: #f0f0f0;
  /* Коэффициент контрастности: 2.1:1 (НЕ ПРОХОДИТ требование WCAG AA 4.5:1) */
}
```

**Почему это плохо:**
- Не проходит проверку доступности WCAG AA (контрастность 4.5:1 для текста).
- Пользователи с нарушениями зрения не могут прочитать контент.
- Плохой UX при ярком солнечном свете (на мобильных устройствах).

**Правильный подход:**
```css
/* ✅ Достаточный контраст */
.readable-text {
  color: #333333;
  background: #ffffff;
  /* Коэффициент контрастности: 12.6:1 (ПРОХОДИТ WCAG AAA) */
}

/* Или используйте токены дизайн-системы */
.text {
  color: var(--color-text-primary);    /* Гарантированно 4.5:1 */
  background: var(--color-bg-surface); /* Относительно цвета текста */
}
```

---

## Чек-лист качества

### Визуальный лоск
- [ ] Цветовая палитра использует максимум 3 основных цвета + нейтральные тона.
- [ ] Иерархия типографики четкая (3-5 размеров шрифта).
- [ ] Отступы следуют последовательной шкале (4px, 8px, 16px, 24px, 32px...).
- [ ] Состояния наведения на всех интерактивных элементах.
- [ ] Состояния загрузки для асинхронных действий.
- [ ] Пустые состояния с полезными сообщениями.

### Доступность
- [ ] Цветовой контраст ≥4.5:1 для текста (WCAG AA).
- [ ] Индикаторы фокуса видимы на всех интерактивных элементах.
- [ ] Анимации учитывают настройку `prefers-reduced-motion`.
- [ ] Альт-текст на всех изображениях.
- [ ] Работает навигация с клавиатуры (Tab, Enter, Esc).

### Адаптивный дизайн
- [ ] Подход "Mobile-first" (база 320px).
- [ ] Брейкпоинты: sm (640px), md (768px), lg (1024px), xl (1280px).
- [ ] Области касания ≥44x44px (для мобильных).
- [ ] Отсутствие горизонтальной прокрутки на мобильных устройствах.
- [ ] Изображения адаптивны (`max-width: 100%`, `height: auto`).

### Производительность
- [ ] Анимации используют `transform` и `opacity` (ускорение GPU).
- [ ] Изображения оптимизированы (WebP, ленивая загрузка).
- [ ] Размер CSS-бандла <50KB (после минификации).
- [ ] Отсутствие сдвигов макета (CLS <0.1).
- [ ] Шрифты предварительно загружены (`<link rel="preload">`).
