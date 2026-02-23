---
name: motion
description: Используйте при добавлении анимаций с помощью Motion Vue (motion-v) — предоставляет компонентный API для анимаций, анимацию жестов, эффекты прокрутки, переходы макета и композиблы для Vue 3/Nuxt.
---

# Motion Vue (motion-v)

Библиотека анимации для Vue 3 и Nuxt. Готовые к использованию в продакшене анимации с аппаратным ускорением и минимальным размером бандла.

**Текущая стабильная версия:** motion-v 1.x — порт Motion (ранее Framer Motion) для Vue.

## Обзор

Прогрессивный справочник для анимаций Motion Vue. Загружайте только те файлы, которые относятся к текущей задаче (~200 токенов база, 500-1500 на каждый подфайл).

## Когда использовать

**Используйте Motion Vue для:**

- Простых декларативных анимаций (fade, slide, scale).
- Взаимодействий на основе жестов (наведение, нажатие, перетаскивание).
- Анимаций, связанных с прокруткой (scroll-linked).
- Анимаций макета и переходов общих элементов.
- Анимаций с использованием пружинной физики (spring physics).

**Рассмотрите альтернативы:**

- **GSAP** — для сложных таймлайнов, морфинга SVG, последовательностей, запускаемых прокруткой.
- **@vueuse/motion** — более простой API, меньше функций, меньший размер бандла.
- **CSS-анимации** — простые переходы без использования JS.

## Установка

```bash
# Vue 3
pnpm add motion-v

# Nuxt 3
pnpm add motion-v @vueuse/nuxt
```

```ts
// nuxt.config.ts — настройка для Nuxt 3
export default defineNuxtConfig({
  modules: ['motion-v/nuxt'],
})
```

## Быстрая справка

| Работаю над...                | Загрузить файл             |
| ---------------------------- | ------------------------- |
| Компонент Motion, жесты      | references/components.md  |
| useMotionValue, useScroll    | references/composables.md |
| Примеры анимаций, паттерны   | references/examples.md    |

## Загрузка файлов

**Рассмотрите возможность загрузки этих справочных файлов в зависимости от вашей задачи:**

- [ ] [references/components.md](references/components.md) — если используете компонент Motion, жесты или анимации макета.
- [ ] [references/composables.md](references/composables.md) — если используете useMotionValue, useScroll, useSpring или animate().
- [ ] [references/examples.md](references/examples.md) — если ищете паттерны анимации или вдохновение.

**НЕ загружайте все файлы сразу.** Загружайте только то, что относится к вашей текущей задаче.

## Основные концепции

### Компонент Motion

Отрисовка любого HTML/SVG элемента с возможностями анимации:

```vue
<script setup lang="ts">
import { motion } from 'motion-v'
</script>

<template>
  <motion.div
    :initial="{ opacity: 0, y: 20 }"
    :animate="{ opacity: 1, y: 0 }"
    :exit="{ opacity: 0, y: -20 }"
    :transition="{ duration: 0.3 }"
  >
    Анимированный контент
  </motion.div>
</template>
```

### Анимация жестов

```vue
<motion.button
  :whileHover="{ scale: 1.05 }"
  :whilePress="{ scale: 0.95 }"
  :transition="{ type: 'spring', stiffness: 400 }"
>
  Нажми на меня
</motion.button>
```

### Анимация при прокрутке

```vue
<motion.div
  :initial="{ opacity: 0 }"
  :whileInView="{ opacity: 1 }"
  :viewport="{ once: true, margin: '-100px' }"
>
  Появляется при прокрутке
</motion.div>
```

## Доступные руководства

**[references/components.md](references/components.md)** — варианты компонентов Motion, пропсы анимации, пропсы жестов, анимации макета, конфигурация переходов.

**[references/composables.md](references/composables.md)** — useMotionValue, useSpring, useTransform, useScroll, useInView, animate().

**[references/examples.md](references/examples.md)** — внешние ресурсы, библиотеки компонентов, паттерны анимаций и вдохновение.
