---
name: docx
description: Используйте этот навык, когда пользователь хочет создать, прочитать, отредактировать или манипулировать документами Word (файлы .docx). Триггеры включают: любое упоминание "Word doc", "word document", ".docx" или запросы на создание профессиональных документов с форматированием, таким как оглавление, заголовки, номера страниц или фирменные бланки. Также используйте при извлечении или реорганизации контента из файлов .docx, вставке или замене изображений в документах, выполнении поиска и замены в файлах Word, работе с отслеживаемыми изменениями или комментариями, или преобразовании контента в отполированный документ Word. Если пользователь просит "отчет", "меморандум", "письмо", "шаблон" или подобный результат в виде Word или .docx файла, используйте этот навык. НЕ используйте для PDF, электронных таблиц, Google Docs или общих задач кодирования, не связанных с генерацией документов.
license: Proprietary. Полные условия в LICENSE.txt
---

# Создание, редактирование и анализ DOCX

## Обзор

Файл .docx — это ZIP-архив, содержащий XML-файлы.

## Краткий Справочник

| Задача | Подход |
|--------|--------|
| Чтение/анализ контента | `pandoc` или распаковка для сырого XML |
| Создание нового документа | Используйте `docx-js` - см. Создание Новых Документов ниже |
| Редактирование существующего | Распаковать → редактировать XML → запаковать - см. Редактирование Существующих Документов ниже |

### Конвертация .doc в .docx

Старые файлы `.doc` должны быть конвертированы перед редактированием:

```bash
python scripts/office/soffice.py --headless --convert-to docx document.doc
```

### Чтение Контента

```bash
# Извлечение текста с отслеживаемыми изменениями
pandoc --track-changes=all document.docx -o output.md

# Доступ к сырому XML
python scripts/office/unpack.py document.docx unpacked/
```

### Конвертация в Изображения

```bash
python scripts/office/soffice.py --headless --convert-to pdf document.docx
pdftoppm -jpeg -r 150 document.pdf page
```

### Принятие Отслеживаемых Изменений

Чтобы создать чистый документ со всеми принятыми изменениями (требуется LibreOffice):

```bash
python scripts/accept_changes.py input.docx output.docx
```

---

## Создание Новых Документов

Генерируйте файлы .docx с помощью JavaScript, затем проверяйте. Установите: `npm install -g docx`

### Настройка
```javascript
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
        Header, Footer, AlignmentType, PageOrientation, LevelFormat, ExternalHyperlink,
        TableOfContents, HeadingLevel, BorderStyle, WidthType, ShadingType,
        VerticalAlign, PageNumber, PageBreak } = require('docx');

const doc = new Document({ sections: [{ children: [/* content */] }] });
Packer.toBuffer(doc).then(buffer => fs.writeFileSync("doc.docx", buffer));
```

### Валидация
После создания файла, проверьте его. Если валидация не прошла, распакуйте, исправьте XML и запакуйте.
```bash
python scripts/office/validate.py doc.docx
```

### Размер Страницы

```javascript
// КРИТИЧНО: docx-js по умолчанию использует A4, а не US Letter
// Всегда устанавливайте размер страницы явно для последовательных результатов
sections: [{
  properties: {
    page: {
      size: {
        width: 12240,   // 8.5 дюймов в DXA
        height: 15840   // 11 дюймов в DXA
      },
      margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } // поля 1 дюйм
    }
  },
  children: [/* content */]
}]
```

**Общие размеры страниц (единицы DXA, 1440 DXA = 1 дюйм):**

| Бумага | Ширина | Высота | Ширина контента (поля 1") |
|-------|-------|--------|---------------------------|
| US Letter | 12,240 | 15,840 | 9,360 |
| A4 (по умолчанию) | 11,906 | 16,838 | 9,026 |

**Ландшафтная ориентация:** docx-js меняет местами ширину/высоту внутри, поэтому передавайте портретные размеры и позвольте ему сделать замену:
```javascript
size: {
  width: 12240,   // Передавайте КОРОТКИЙ край как ширину
  height: 15840,  // Передавайте ДЛИННЫЙ край как высоту
  orientation: PageOrientation.LANDSCAPE  // docx-js меняет их местами в XML
},
// Ширина контента = 15840 - левое поле - правое поле (использует длинный край)
```

### Стили (Переопределение Встроенных Заголовков)

Используйте Arial как шрифт по умолчанию (универсально поддерживается). Держите заголовки черными для читаемости.

```javascript
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 24 } } }, // 12pt по умолчанию
    paragraphStyles: [
      // ВАЖНО: Используйте точные ID для переопределения встроенных стилей
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 } }, // outlineLevel обязателен для TOC
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 180, after: 180 }, outlineLevel: 1 } },
    ]
  },
  sections: [{
    children: [
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Title")] }),
    ]
  }]
});
```

### Списки (НИКОГДА не используйте unicode маркеры)

```javascript
// ❌ НЕПРАВИЛЬНО - никогда вручную не вставляйте символы маркеров
new Paragraph({ children: [new TextRun("• Item")] })  // ПЛОХО
new Paragraph({ children: [new TextRun("\u2022 Item")] })  // ПЛОХО

// ✅ ПРАВИЛЬНО - используйте конфигурацию нумерации с LevelFormat.BULLET
const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    children: [
      new Paragraph({ numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("Bullet item")] }),
      new Paragraph({ numbering: { reference: "numbers", level: 0 },
        children: [new TextRun("Numbered item")] }),
    ]
  }]
});

// ⚠️ Каждая ссылка создает НЕЗАВИСИМУЮ нумерацию
// Та же ссылка = продолжается (1,2,3 затем 4,5,6)
// Другая ссылка = перезапускается (1,2,3 затем 1,2,3)
```

### Таблицы

**КРИТИЧНО: Таблицы нуждаются в двойной ширине** - установите и `columnWidths` в таблице, И `width` в каждой ячейке. Без обоих параметров таблицы рендерятся некорректно на некоторых платформах.

```javascript
// КРИТИЧНО: Всегда устанавливайте ширину таблицы для последовательного рендеринга
// КРИТИЧНО: Используйте ShadingType.CLEAR (не SOLID) для предотвращения черных фонов
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

new Table({
  width: { size: 9360, type: WidthType.DXA }, // Всегда используйте DXA (проценты ломаются в Google Docs)
  columnWidths: [4680, 4680], // Должно суммироваться в ширину таблицы (DXA: 1440 = 1 дюйм)
  rows: [
    new TableRow({
      children: [
        new TableCell({
          borders,
          width: { size: 4680, type: WidthType.DXA }, // Также установите на каждой ячейке
          shading: { fill: "D5E8F0", type: ShadingType.CLEAR }, // CLEAR не SOLID
          margins: { top: 80, bottom: 80, left: 120, right: 120 }, // Отступы ячейки (внутренние, не добавляются к ширине)
          children: [new Paragraph({ children: [new TextRun("Cell")] })]
        })
      ]
    })
  ]
})
```

**Расчет ширины таблицы:**

Всегда используйте `WidthType.DXA` — `WidthType.PERCENTAGE` ломается в Google Docs.

```javascript
// Ширина таблицы = сумма columnWidths = ширина контента
// US Letter с полями 1": 12240 - 2880 = 9360 DXA
width: { size: 9360, type: WidthType.DXA },
columnWidths: [7000, 2360]  // Должно суммироваться в ширину таблицы
```

**Правила ширины:**
- **Всегда используйте `WidthType.DXA`** — никогда `WidthType.PERCENTAGE` (несовместимо с Google Docs)
- Ширина таблицы должна равняться сумме `columnWidths`
- `width` ячейки должна соответствовать соответствующей `columnWidth`
- `margins` ячейки — это внутренние отступы — они уменьшают область контента, а не добавляют к ширине ячейки
- Для таблиц во всю ширину: используйте ширину контента (ширина страницы минус левое и правое полe)

### Изображения

```javascript
// КРИТИЧНО: параметр type ОБЯЗАТЕЛЕН
new Paragraph({
  children: [new ImageRun({
    type: "png", // Обязательно: png, jpg, jpeg, gif, bmp, svg
    data: fs.readFileSync("image.png"),
    transformation: { width: 200, height: 150 },
    altText: { title: "Title", description: "Desc", name: "Name" } // Все три обязательны
  })]
})
```

### Разрывы Страниц

```javascript
// КРИТИЧНО: PageBreak должен быть внутри Paragraph
new Paragraph({ children: [new PageBreak()] })

// Или используйте pageBreakBefore
new Paragraph({ pageBreakBefore: true, children: [new TextRun("New page")] })
```

### Оглавление (TOC)

```javascript
// КРИТИЧНО: Заголовки должны использовать ТОЛЬКО HeadingLevel - никаких пользовательских стилей
new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" })
```

### Верхние/Нижние Колонтитулы

```javascript
sections: [{
  properties: {
    page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } // 1440 = 1 дюйм
  },
  headers: {
    default: new Header({ children: [new Paragraph({ children: [new TextRun("Header")] })] })
  },
  footers: {
    default: new Footer({ children: [new Paragraph({
      children: [new TextRun("Page "), new TextRun({ children: [PageNumber.CURRENT] })]
    })] })
  },
  children: [/* content */]
}]
```

### Критические Правила для docx-js

- **Устанавливайте размер страницы явно** - docx-js по умолчанию использует A4; используйте US Letter (12240 x 15840 DXA) для документов США
- **Ландшафт: передавайте портретные размеры** - docx-js меняет ширину/высоту внутри; передавайте короткий край как `width`, длинный как `height`, и устанавливайте `orientation: PageOrientation.LANDSCAPE`
- **Никогда не используйте `\n`** - используйте отдельные элементы Paragraph
- **Никогда не используйте unicode маркеры** - используйте `LevelFormat.BULLET` с конфигурацией нумерации
- **PageBreak должен быть в Paragraph** - сам по себе создает невалидный XML
- **ImageRun требует `type`** - всегда указывайте png/jpg/etc
- **Всегда устанавливайте `width` таблицы в DXA** - никогда `WidthType.PERCENTAGE` (ломается в Google Docs)
- **Таблицы нуждаются в двойной ширине** - массив `columnWidths` И `width` ячейки, оба должны совпадать
- **Ширина таблицы = сумма columnWidths** - для DXA, убедитесь, что они складываются точно
- **Всегда добавляйте отступы ячеек** - используйте `margins: { top: 80, bottom: 80, left: 120, right: 120 }` для читаемых отступов
- **Используйте `ShadingType.CLEAR`** - никогда SOLID для заливки таблицы
- **TOC требует только HeadingLevel** - никаких пользовательских стилей на параграфах заголовков
- **Переопределяйте встроенные стили** - используйте точные ID: "Heading1", "Heading2", и т.д.
- **Включайте `outlineLevel`** - обязательно для TOC (0 для H1, 1 для H2, и т.д.)

---

## Редактирование Существующих Документов

**Следуйте всем 3 шагам по порядку.**

### Шаг 1: Распаковка
```bash
python scripts/office/unpack.py document.docx unpacked/
```
Извлекает XML, форматирует его, объединяет смежные прогоны (runs) и конвертирует умные кавычки в XML-сущности (`&#x201C;` и т.д.), чтобы они пережили редактирование. Используйте `--merge-runs false`, чтобы пропустить объединение прогонов.

### Шаг 2: Редактирование XML

Редактируйте файлы в `unpacked/word/`. См. Справочник XML ниже для паттернов.

**Используйте "Claude" как автора** для отслеживаемых изменений и комментариев, если пользователь явно не попросит использовать другое имя.

**Используйте инструмент Edit (Редактирование) напрямую для замены строк. Не пишите Python скрипты.** Скрипты вводят ненужную сложность. Инструмент Edit показывает именно то, что заменяется.

**КРИТИЧНО: Используйте умные кавычки для нового контента.** При добавлении текста с апострофами или кавычками используйте XML-сущности для получения умных кавычек:
```xml
<!-- Используйте эти сущности для профессиональной типографики -->
<w:t>Here&#x2019;s a quote: &#x201C;Hello&#x201D;</w:t>
```
| Сущность | Символ |
|--------|-----------|
| `&#x2018;` | ‘ (левая одинарная) |
| `&#x2019;` | ’ (правая одинарная / апостроф) |
| `&#x201C;` | “ (левая двойная) |
| `&#x201D;` | ” (правая двойная) |

**Добавление комментариев:** Используйте `comment.py` для обработки шаблона в нескольких XML файлах (текст должен быть предварительно экранированным XML):
```bash
python scripts/comment.py unpacked/ 0 "Comment text with &amp; and &#x2019;"
python scripts/comment.py unpacked/ 1 "Reply text" --parent 0  # ответ на комментарий 0
python scripts/comment.py unpacked/ 0 "Text" --author "Custom Author"  # пользовательское имя автора
```
Затем добавьте маркеры в document.xml (см. Комментарии в Справочнике XML).

### Шаг 3: Запаковка
```bash
python scripts/office/pack.py unpacked/ output.docx --original document.docx
```
Валидирует с авто-исправлением, сжимает XML и создает DOCX. Используйте `--validate false`, чтобы пропустить.

**Авто-исправление починит:**
- `durableId` >= 0x7FFFFFFF (регенерирует валидный ID)
- Отсутствующий `xml:space="preserve"` на `<w:t>` с пробелами

**Авто-исправление не починит:**
- Искаженный XML, невалидную вложенность элементов, отсутствующие отношения, нарушения схемы

### Частые Ошибки

- **Заменяйте целые элементы `<w:r>`**: При добавлении отслеживаемых изменений, заменяйте весь блок `<w:r>...</w:r>` на `<w:del>...<w:ins>...` как соседей. Не внедряйте теги отслеживаемых изменений внутри прогона (run).
- **Сохраняйте форматирование `<w:rPr>`**: Копируйте блок `<w:rPr>` оригинального прогона в ваши прогоны отслеживаемых изменений, чтобы сохранить жирность, размер шрифта и т.д.

---

## Справочник XML

### Соответствие Схеме

- **Порядок элементов в `<w:pPr>`**: `<w:pStyle>`, `<w:numPr>`, `<w:spacing>`, `<w:ind>`, `<w:jc>`, `<w:rPr>` последним
- **Пробелы**: Добавьте `xml:space="preserve"` к `<w:t>` с ведущими/замыкающими пробелами
- **RSID**: Должны быть 8-значными hex (например, `00AB1234`)

### Отслеживаемые Изменения

**Вставка:**
```xml
<w:ins w:id="1" w:author="Claude" w:date="2025-01-01T00:00:00Z">
  <w:r><w:t>inserted text</w:t></w:r>
</w:ins>
```

**Удаление:**
```xml
<w:del w:id="2" w:author="Claude" w:date="2025-01-01T00:00:00Z">
  <w:r><w:delText>deleted text</w:delText></w:r>
</w:del>
```

**Внутри `<w:del>`**: Используйте `<w:delText>` вместо `<w:t>`, и `<w:delInstrText>` вместо `<w:instrText>`.

**Минимальные правки** - отмечайте только то, что меняется:
```xml
<!-- Change "30 days" to "60 days" -->
<w:r><w:t>The term is </w:t></w:r>
<w:del w:id="1" w:author="Claude" w:date="...">
  <w:r><w:delText>30</w:delText></w:r>
</w:del>
<w:ins w:id="2" w:author="Claude" w:date="...">
  <w:r><w:t>60</w:t></w:r>
</w:ins>
<w:r><w:t> days.</w:t></w:r>
```

**Удаление целых параграфов/элементов списка** - при удалении ВСЕГО контента из параграфа, также помечайте метку параграфа как удаленную, чтобы она слилась со следующим параграфом. Добавьте `<w:del/>` внутри `<w:pPr><w:rPr>`:
```xml
<w:p>
  <w:pPr>
    <w:numPr>...</w:numPr>  <!-- нумерация списка, если есть -->
    <w:rPr>
      <w:del w:id="1" w:author="Claude" w:date="2025-01-01T00:00:00Z"/>
    </w:rPr>
  </w:pPr>
  <w:del w:id="2" w:author="Claude" w:date="2025-01-01T00:00:00Z">
    <w:r><w:delText>Entire paragraph content being deleted...</w:delText></w:r>
  </w:del>
</w:p>
```
Без `<w:del/>` в `<w:pPr><w:rPr>`, принятие изменений оставляет пустой параграф/элемент списка.

**Отклонение вставки другого автора** - вложите удаление внутрь их вставки:
```xml
<w:ins w:author="Jane" w:id="5">
  <w:del w:author="Claude" w:id="10">
    <w:r><w:delText>their inserted text</w:delText></w:r>
  </w:del>
</w:ins>
```

**Восстановление удаления другого автора** - добавьте вставку после (не изменяйте их удаление):
```xml
<w:del w:author="Jane" w:id="5">
  <w:r><w:delText>deleted text</w:delText></w:r>
</w:del>
<w:ins w:author="Claude" w:id="10">
  <w:r><w:t>deleted text</w:t></w:r>
</w:ins>
```

### Комментарии

После запуска `comment.py` (см. Шаг 2), добавьте маркеры в document.xml. Для ответов используйте флаг `--parent` и вкладывайте маркеры внутрь родительских.

**КРИТИЧНО: `<w:commentRangeStart>` и `<w:commentRangeEnd>` являются соседями `<w:r>`, никогда внутри `<w:r>`.**

```xml
<!-- Маркеры комментариев - прямые дети w:p, никогда внутри w:r -->
<w:commentRangeStart w:id="0"/>
<w:del w:id="1" w:author="Claude" w:date="2025-01-01T00:00:00Z">
  <w:r><w:delText>deleted</w:delText></w:r>
</w:del>
<w:r><w:t> more text</w:t></w:r>
<w:commentRangeEnd w:id="0"/>
<w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:commentReference w:id="0"/></w:r>

<!-- Комментарий 0 с ответом 1, вложенным внутри -->
<w:commentRangeStart w:id="0"/>
  <w:commentRangeStart w:id="1"/>
  <w:r><w:t>text</w:t></w:r>
  <w:commentRangeEnd w:id="1"/>
<w:commentRangeEnd w:id="0"/>
<w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:commentReference w:id="0"/></w:r>
<w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:commentReference w:id="1"/></w:r>
```

### Изображения

1. Добавьте файл изображения в `word/media/`
2. Добавьте отношение в `word/_rels/document.xml.rels`:
```xml
<Relationship Id="rId5" Type=".../image" Target="media/image1.png"/>
```
3. Добавьте тип контента в `[Content_Types].xml`:
```xml
<Default Extension="png" ContentType="image/png"/>
```
4. Ссылка в document.xml:
```xml
<w:drawing>
  <wp:inline>
    <wp:extent cx="914400" cy="914400"/>  <!-- EMUs: 914400 = 1 дюйм -->
    <a:graphic>
      <a:graphicData uri=".../picture">
        <pic:pic>
          <pic:blipFill><a:blip r:embed="rId5"/></pic:blipFill>
        </pic:pic>
      </a:graphicData>
    </a:graphic>
  </wp:inline>
</w:drawing>
```

---

## Зависимости

- **pandoc**: Извлечение текста
- **docx**: `npm install -g docx` (новые документы)
- **LibreOffice**: Конвертация PDF (авто-настроено для изолированных сред через `scripts/office/soffice.py`)
- **Poppler**: `pdftoppm` для изображений
