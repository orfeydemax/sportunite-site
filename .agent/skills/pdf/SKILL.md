---
name: pdf
description: Используйте этот навык, когда пользователь хочет сделать что-то с PDF-файлами. Это включает чтение или извлечение текста/таблиц из PDF, объединение нескольких PDF в один, разделение PDF, поворот страниц, добавление водяных знаков, создание новых PDF, заполнение PDF-форм, шифрование/дешифрование PDF, извлечение изображений и OCR на сканированных PDF, чтобы сделать их доступными для поиска. Если пользователь упоминает .pdf файл или просит создать его, используйте этот навык.
license: Proprietary. Полные условия в LICENSE.txt
---

# Руководство по Обработке PDF

## Обзор

Это руководство охватывает основные операции обработки PDF с использованием библиотек Python и инструментов командной строки. Для продвинутых функций, библиотек JavaScript и детальных примеров см. REFERENCE.md. Если вам нужно заполнить PDF-форму, прочитайте FORMS.md и следуйте инструкциям в нем.

## Быстрый Старт

```python
from pypdf import PdfReader, PdfWriter

# Чтение PDF
reader = PdfReader("document.pdf")
print(f"Pages: {len(reader.pages)}")

# Извлечение текста
text = ""
for page in reader.pages:
    text += page.extract_text()
```

## Библиотеки Python

### pypdf - Основные Операции

#### Объединение PDF
```python
from pypdf import PdfWriter, PdfReader

writer = PdfWriter()
for pdf_file in ["doc1.pdf", "doc2.pdf", "doc3.pdf"]:
    reader = PdfReader(pdf_file)
    for page in reader.pages:
        writer.add_page(page)

with open("merged.pdf", "wb") as output:
    writer.write(output)
```

#### Разделение PDF
```python
reader = PdfReader("input.pdf")
for i, page in enumerate(reader.pages):
    writer = PdfWriter()
    writer.add_page(page)
    with open(f"page_{i+1}.pdf", "wb") as output:
        writer.write(output)
```

#### Извлечение Метаданных
```python
reader = PdfReader("document.pdf")
meta = reader.metadata
print(f"Title: {meta.title}")
print(f"Author: {meta.author}")
print(f"Subject: {meta.subject}")
print(f"Creator: {meta.creator}")
```

#### Поворот Страниц
```python
reader = PdfReader("input.pdf")
writer = PdfWriter()

page = reader.pages[0]
page.rotate(90)  # Повернуть на 90 градусов по часовой стрелке
writer.add_page(page)

with open("rotated.pdf", "wb") as output:
    writer.write(output)
```

### pdfplumber - Извлечение Текста и Таблиц

#### Извлечение Текста с Макетом
```python
import pdfplumber

with pdfplumber.open("document.pdf") as pdf:
    for page in pdf.pages:
        text = page.extract_text()
        print(text)
```

#### Извлечение Таблиц
```python
with pdfplumber.open("document.pdf") as pdf:
    for i, page in enumerate(pdf.pages):
        tables = page.extract_tables()
        for j, table in enumerate(tables):
            print(f"Table {j+1} on page {i+1}:")
            for row in table:
                print(row)
```

#### Продвинутое Извлечение Таблиц
```python
import pandas as pd

with pdfplumber.open("document.pdf") as pdf:
    all_tables = []
    for page in pdf.pages:
        tables = page.extract_tables()
        for table in tables:
            if table:  # Проверка, не пуста ли таблица
                df = pd.DataFrame(table[1:], columns=table[0])
                all_tables.append(df)

# Объединение всех таблиц
if all_tables:
    combined_df = pd.concat(all_tables, ignore_index=True)
    combined_df.to_excel("extracted_tables.xlsx", index=False)
```

### reportlab - Создание PDF

#### Создание Простого PDF
```python
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

c = canvas.Canvas("hello.pdf", pagesize=letter)
width, height = letter

# Добавление текста
c.drawString(100, height - 100, "Hello World!")
c.drawString(100, height - 120, "This is a PDF created with reportlab")

# Добавление линии
c.line(100, height - 140, 400, height - 140)

# Сохранение
c.save()
```

#### Создание PDF с Несколькими Страницами
```python
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet

doc = SimpleDocTemplate("report.pdf", pagesize=letter)
styles = getSampleStyleSheet()
story = []

# Добавление контента
title = Paragraph("Report Title", styles['Title'])
story.append(title)
story.append(Spacer(1, 12))

body = Paragraph("This is the body of the report. " * 20, styles['Normal'])
story.append(body)
story.append(PageBreak())

# Страница 2
story.append(Paragraph("Page 2", styles['Heading1']))
story.append(Paragraph("Content for page 2", styles['Normal']))

# Сборка PDF
doc.build(story)
```

#### Подстрочные и Надстрочные Индексы

**ВАЖНО**: Никогда не используйте символы Unicode для подстрочных/надстрочных индексов (₀₁₂₃₄₅₆₇₈₉, ⁰¹²³⁴⁵⁶⁷⁸⁹) в PDF ReportLab. Встроенные шрифты не включают эти глифы, что приводит к их отображению в виде черных квадратов.

Вместо этого используйте теги XML разметки ReportLab в объектах Paragraph:
```python
from reportlab.platypus import Paragraph
from reportlab.lib.styles import getSampleStyleSheet

styles = getSampleStyleSheet()

# Подстрочные: используйте тег <sub>
chemical = Paragraph("H<sub>2</sub>O", styles['Normal'])

# Надстрочные: используйте тег <super>
squared = Paragraph("x<super>2</super> + y<super>2</super>", styles['Normal'])
```

Для текста, нарисованного на canvas (не объекты Paragraph), вручную регулируйте размер шрифта и позицию, а не используйте подстрочные/надстрочные символы Unicode.

## Инструменты Командной Строки

### pdftotext (poppler-utils)
```bash
# Извлечение текста
pdftotext input.pdf output.txt

# Извлечение текста с сохранением макета
pdftotext -layout input.pdf output.txt

# Извлечение конкретных страниц
pdftotext -f 1 -l 5 input.pdf output.txt  # Страницы 1-5
```

### qpdf
```bash
# Объединение PDF
qpdf --empty --pages file1.pdf file2.pdf -- merged.pdf

# Разделение страниц
qpdf input.pdf --pages . 1-5 -- pages1-5.pdf
qpdf input.pdf --pages . 6-10 -- pages6-10.pdf

# Поворот страниц
qpdf input.pdf output.pdf --rotate=+90:1  # Повернуть страницу 1 на 90 градусов
```

### pdftk (если доступен)
```bash
# Объединение
pdftk file1.pdf file2.pdf cat output merged.pdf

# Разделение
pdftk input.pdf burst
```

## Частые Задачи

### Извлечение Текста из Сканированных PDF
```python
# Требуется: pip install pytesseract pdf2image
import pytesseract
from pdf2image import convert_from_path

# Конвертация PDF в изображения
images = convert_from_path('scanned.pdf')

# OCR каждой страницы
text = ""
for i, image in enumerate(images):
    text += f"Page {i+1}:\n"
    text += pytesseract.image_to_string(image)
    text += "\n\n"

print(text)
```

### Добавление Водяного Знака
```python
from pypdf import PdfReader, PdfWriter

# Создание водяного знака (или загрузка существующего)
watermark = PdfReader("watermark.pdf").pages[0]

# Применение ко всем страницам
reader = PdfReader("document.pdf")
writer = PdfWriter()

for page in reader.pages:
    page.merge_page(watermark)
    writer.add_page(page)

with open("watermarked.pdf", "wb") as output:
    writer.write(output)
```

### Извлечение Изображений
```bash
# Использование pdfimages (poppler-utils)
pdfimages -j input.pdf output_prefix

# Это извлекает все изображения как output_prefix-000.jpg, output_prefix-001.jpg и т.д.
```

### Защита Паролем
```python
from pypdf import PdfReader, PdfWriter

reader = PdfReader("input.pdf")
writer = PdfWriter()

for page in reader.pages:
    writer.add_page(page)

# Добавление пароля
writer.encrypt("userpassword", "ownerpassword")

with open("encrypted.pdf", "wb") as output:
    writer.write(output)
```

## Краткий Справочник

| Задача | Лучший Инструмент | Команда/Код |
|--------|-------------------|-------------|
| Объединение PDF | pypdf | `writer.add_page(page)` |
| Разделение PDF | pypdf | Одна страница на файл |
| Извлечение текста | pdfplumber | `page.extract_text()` |
| Извлечение таблиц | pdfplumber | `page.extract_tables()` |
| Создание PDF | reportlab | Canvas или Platypus |
| Объединение (CLI) | qpdf | `qpdf --empty --pages ...` |
| OCR сканированных PDF | pytesseract | Конвертировать в изображение сначала |
| Заполнение форм PDF | pdf-lib или pypdf (см. FORMS.md) | См. FORMS.md |

## Следующие Шаги

- Для продвинутого использования pypdfium2 см. REFERENCE.md
- Для библиотек JavaScript (pdf-lib) см. REFERENCE.md
- Если вам нужно заполнить PDF-форму, следуйте инструкциям в FORMS.md
- Для руководств по устранению неполадок см. REFERENCE.md
