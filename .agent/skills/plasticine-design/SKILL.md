---
name: clay-asset-pipeline
description: Рабочий процесс для создания UI в стиле "Настоящий пластилин" (Claymorphism) с использованием сгенерированных графических ассетов. Используйте этот навык, когда требуется создать тактильный, реалистичный пластилиновый интерфейс (кнопки, плашки, иконки, карточки слов). Навык запрещает использовать чистый CSS для отрисовки объема и переключает систему на генерацию промптов для создания изображений с последующей их интеграцией через background-image или теги img.
---

# Clay Asset Pipeline (Пластилиновый UI)

Этот навык описывает алгоритм работы при создании элементов интерфейса в стиле "реалистичный пластилин". 

**Главное правило:** Не пытайтесь создать текстуру пластилина, отпечатки пальцев или органические неровности с помощью CSS `box-shadow` или `filter`. Это выглядит неестественно. Вместо этого интерфейс собирается из нарезанных PNG-изображений с прозрачным фоном.

## Алгоритм работы (Рабочий процесс)

При запросе на создание пластилинового элемента интерфейса (например, кнопки "Учить" или плашки для перевода), следуйте строго по шагам:

### Шаг 1: Формирование промпта для генерации ассета

Создайте детальный промпт для генерации изображения (для модели Nano Banana или аналога). Изображение должно генерироваться на **изолированном контрастном фоне** (белый или зеленый хромакей) для легкого вырезания.

**Структура промпта:**
1. **Объект:** Что лепим (кнопка, иконка, пустая плашка для текста).
2. **Стиль:** stop-motion animation, claymation, handmade modeling clay.
3. **Детали:** Отпечатки пальцев, микротрещины, мягкие неровные края, матовая текстура.
4. **Освещение:** Студийный свет сверху-слева, мягкие глубокие тени для подчеркивания объема.
5. **Фон:** Isolated on a pure solid white background.

*Пример промпта (для пустой карточки слова):*
> "A rectangular blank UI card made of soft purple modeling clay, organic uneven blob edges, visible fingerprints and clay texture, tactile handmade feel, 3d claymation style, soft studio lighting from top-left, casting a soft shadow. Isolated on a pure solid white background, high resolution."

*Промпт для иллюстрации слова (карточка словаря):*
> "A handmade claymation scene representing the word "[WORD]". Exaggerated playful action, vivid emotions, colorful plasticine texture with visible fingerprints, soft cinematic lighting, stop motion animation style, high resolution, whimsical and memorable composition"

Этот промпт используется через утилиту `backend/app/services/image_prompts.py` → функция `get_word_image_prompt(word)`.

### Шаг 2: Инструкция для пользователя

Выдайте пользователю сформированный промпт и объясните, что ему нужно сделать:
1. Сгенерировать картинку по этому промпту.
2. Удалить белый фон (сделать PNG с альфа-каналом).
3. Сохранить файл в проект (например, `assets/clay-card-purple.png`).

### Шаг 3: Генерация кода интеграции (Верстка)

Выдайте пользователю код (CSS/React/HTML) для использования этого изображения. 
* В CSS мы используем только физику поведения (анимации нажатия, hover) и позиционирование текста поверх картинки.
* Никаких сложных градиентов или теней для имитации объема — объем уже есть на картинке.

**Пример интеграции кнопки (React + Tailwind + Framer Motion):**

```jsx
// Накладываем текст поверх пластилиновой картинки-фона
<motion.button
    whileTap={{ scale: 0.92, translateY: 4 }}
    transition={{ type: "spring", stiffness: 400, damping: 17 }}
    className="relative flex items-center justify-center w-64 h-20 bg-transparent border-none cursor-pointer"
>
    {/* Фон: вырезанная PNG пластилиновой кнопки */}
    <img 
        src="/assets/clay-btn-green.png" 
        alt="" 
        className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
    />
    
    {/* Текст поверх кнопки (эффект вдавленности) */}
    <span className="relative z-10 text-white font-black text-2xl tracking-wide" style={{ textShadow: "1px 1px 1px rgba(255,255,255,0.4), -1px -1px 2px rgba(0,0,0,0.2)" }}>
        Продолжить
    </span>
</motion.button>
```

## Правила типографики поверх пластилина

Текст поверх сгенерированных плашек должен выглядеть органично.
Используйте CSS для создания эффекта "вдавленного" (stamped) текста в глину:

```css
.text-clay-sunken {
    color: #4a4a4a; /* Темнее фона */
    /* Тень снизу-справа (свет) и сверху-слева (тень) для эффекта тиснения */
    text-shadow: 
        1px 1px 1px rgba(255, 255, 255, 0.7), 
        -1px -1px 1px rgba(0, 0, 0, 0.1);
}
```
