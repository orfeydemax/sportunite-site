---
name: data-visualization
description: Создавайте эффективные визуализации данных с использованием Python (matplotlib, seaborn, plotly). Используйте при создании графиков, выборе правильного типа диаграммы для набора данных, создании качественных рисунков для публикаций или применении принципов дизайна, таких как доступность и теория цвета.
---

# Навык визуализации данных

Руководство по выбору диаграмм, шаблоны кода визуализации на Python, принципы дизайна и вопросы доступности для создания эффективных визуализаций данных.

## Гид по выбору диаграмм

### Выбор по взаимосвязи данных

| Что вы показываете | Лучшая диаграмма | Альтернативы |
|---|---|---|
| **Тренд во времени** | Линейный график (Line chart) | Областная диаграмма (Area chart) |
| **Сравнение по категориям** | Вертикальная столбчатая диаграмма | Горизонтальные столбцы, lollipop chart |
| **Ранжирование** | Горизонтальная столбчатая диаграмма | Точечный график (Dot plot), slope chart |
| **Состав (часть к целому)** | Стековая столбчатая диаграмма | Treemap (иерархическая), waffle chart |
| **Состав во времени** | Стековая областная диаграмма | 100% стековая столбчатая (для фокуса на пропорциях) |
| **Распределение** | Гистограмма | Box plot (сравнение групп), violin plot, strip plot |
| **Корреляция (2 переменные)** | Диаграмма рассеяния (Scatter plot) | Пузырьковая диаграмма (Bubble chart) |
| **Корреляция (много переменных)**| Тепловая карта (Heatmap) | Pair plot |
| **Географические паттерны** | Картограмма (Choropleth map) | Bubble map, hex map |
| **Потоки / процессы** | Диаграмма Санки (Sankey diagram) | Воронка (Funnel chart) |
| **Сеть взаимосвязей** | Граф сети (Network graph) | Chord diagram |
| **Показатели против цели** | Пулевая диаграмма (Bullet chart) | Gauge (только для одного KPI) |
| **Множество KPI сразу** | Фасетные графики (Small multiples) | Дашборд с отдельными графиками |

### Когда НЕ следует использовать определенные графики

- **Круговые диаграммы (Pie charts)**: Избегайте, если категорий больше 6 или если точные пропорции важнее грубого сравнения. Люди плохо сравнивают углы. Используйте столбчатые диаграммы.
- **3D-графики**: Никогда. Они искажают восприятие и не добавляют информации.
- **Графики с двумя осями (Dual-axis)**: Используйте с осторожностью. Они могут вводить в заблуждение, намекая на ложную корреляцию. Если используете, четко подписывайте обе оси.
- **Стековые столбчатые диаграммы (много категорий)**: Трудно сравнивать срединные сегменты. Используйте фасетные графики или сгруппированные столбцы.
- **Кольцевые диаграммы (Donut charts)**: Немного лучше круговых, но проблемы те же. Используйте максимум для отображения одного KPI.

## Шаблоны кода визуализации на Python

### Настройка и стилизация

```python
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import seaborn as sns
import pandas as pd
import numpy as np

# Профессиональная настройка стиля
plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams.update({
    'figure.figsize': (10, 6),
    'figure.dpi': 150,
    'font.size': 11,
    'axes.titlesize': 14,
    'axes.titleweight': 'bold',
    'axes.labelsize': 11,
    'xtick.labelsize': 10,
    'ytick.labelsize': 10,
    'legend.fontsize': 10,
    'figure.titlesize': 16,
})

# Палитры, дружелюбные к цветовой слепоте
PALETTE_CATEGORICAL = ['#4C72B0', '#DD8452', '#55A868', '#C44E52', '#8172B3', '#937860']
PALETTE_SEQUENTIAL = 'YlOrRd'
PALETTE_DIVERGING = 'RdBu_r'
```

### Линейный график (Временные ряды)

```python
fig, ax = plt.subplots(figsize=(10, 6))

for label, group in df.groupby('category'):
    ax.plot(group['date'], group['value'], label=label, linewidth=2)

ax.set_title('Тренд метрики по категориям', fontweight='bold')
ax.set_xlabel('Дата')
ax.set_ylabel('Значение')
ax.legend(loc='upper left', frameon=True)
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)

# Форматирование дат на оси X
fig.autofmt_xdate()

plt.tight_layout()
plt.savefig('trend_chart.png', dpi=150, bbox_inches='tight')
```

### Столбчатая диаграмма (Сравнение)

```python
fig, ax = plt.subplots(figsize=(10, 6))

# Сортировка по значению для легкого чтения
df_sorted = df.sort_values('metric', ascending=True)

bars = ax.barh(df_sorted['category'], df_sorted['metric'], color=PALETTE_CATEGORICAL[0])

# Добавление подписей значений
for bar in bars:
    width = bar.get_width()
    ax.text(width + 0.5, bar.get_y() + bar.get_height()/2,
            f'{width:,.0f}', ha='left', va='center', fontsize=10)

ax.set_title('Метрика по категориям (Ранжирование)', fontweight='bold')
ax.set_xlabel('Значение метрики')
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)

plt.tight_layout()
plt.savefig('bar_chart.png', dpi=150, bbox_inches='tight')
```

### Гистограмма (Распределение)

```python
fig, ax = plt.subplots(figsize=(10, 6))

ax.hist(df['value'], bins=30, color=PALETTE_CATEGORICAL[0], edgecolor='white', alpha=0.8)

# Добавление линий среднего и медианы
mean_val = df['value'].mean()
median_val = df['value'].median()
ax.axvline(mean_val, color='red', linestyle='--', linewidth=1.5, label=f'Среднее: {mean_val:,.1f}')
ax.axvline(median_val, color='green', linestyle='--', linewidth=1.5, label=f'Медиана: {median_val:,.1f}')

ax.set_title('Распределение значений', fontweight='bold')
ax.set_xlabel('Значение')
ax.set_ylabel('Частота')
ax.legend()
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)

plt.tight_layout()
plt.savefig('histogram.png', dpi=150, bbox_inches='tight')
```

### Тепловая карта (Heatmap)

```python
fig, ax = plt.subplots(figsize=(10, 8))

# Группировка данных для формата тепловой карты
pivot = df.pivot_table(index='row_dim', columns='col_dim', values='metric', aggfunc='sum')

sns.heatmap(pivot, annot=True, fmt=',.0f', cmap='YlOrRd',
            linewidths=0.5, ax=ax, cbar_kws={'label': 'Значение метрики'})

ax.set_title('Метрика по измерениям строк и столбцов', fontweight='bold')
ax.set_xlabel('Измерение столбцов')
ax.set_ylabel('Измерение строк')

plt.tight_layout()
plt.savefig('heatmap.png', dpi=150, bbox_inches='tight')
```

### Фасетные графики (Small Multiples)

```python
categories = df['category'].unique()
n_cats = len(categories)
n_cols = min(3, n_cats)
n_rows = (n_cats + n_cols - 1) // n_cols

fig, axes = plt.subplots(n_rows, n_cols, figsize=(5*n_cols, 4*n_rows), sharex=True, sharey=True)
axes = axes.flatten() if n_cats > 1 else [axes]

for i, cat in enumerate(categories):
    ax = axes[i]
    subset = df[df['category'] == cat]
    ax.plot(subset['date'], subset['value'], color=PALETTE_CATEGORICAL[i % len(PALETTE_CATEGORICAL)])
    ax.set_title(cat, fontsize=12)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)

# Скрыть пустые подграфики
for j in range(i+1, len(axes)):
    axes[j].set_visible(False)

fig.suptitle('Тренды по категориям', fontsize=14, fontweight='bold', y=1.02)
plt.tight_layout()
plt.savefig('small_multiples.png', dpi=150, bbox_inches='tight')
```

### Помощники для форматирования чисел

```python
def format_number(val, format_type='number'):
    """Форматирование чисел для подписей на графиках."""
    if format_type == 'currency':
        if abs(val) >= 1e9:
            return f'${val/1e9:.1f}B'
        elif abs(val) >= 1e6:
            return f'${val/1e6:.1f}M'
        elif abs(val) >= 1e3:
            return f'${val/1e3:.1f}K'
        else:
            return f'${val:,.0f}'
    elif format_type == 'percent':
        return f'{val:.1f}%'
    elif format_type == 'number':
        if abs(val) >= 1e9:
            return f'{val/1e9:.1f}B'
        elif abs(val) >= 1e6:
            return f'{val/1e6:.1f}M'
        elif abs(val) >= 1e3:
            return f'{val/1e3:.1f}K'
        else:
            return f'{val:,.0f}'
    return str(val)

# Использование с форматировщиком оси
ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, p: format_number(x, 'currency')))
```

### Интерактивные графики с Plotly

```python
import plotly.express as px
import plotly.graph_objects as go

# Простой интерактивный линейный график
fig = px.line(df, x='date', y='value', color='category',
              title='Интерактивный тренд метрики',
              labels={'value': 'Значение метрики', 'date': 'Дата'})
fig.update_layout(hovermode='x unified')
fig.write_html('interactive_chart.html')
fig.show()

# Интерактивная диаграмма рассеяния с данными при наведении
fig = px.scatter(df, x='metric_a', y='metric_b', color='category',
                 size='size_metric', hover_data=['name', 'detail_field'],
                 title='Анализ корреляции')
fig.show()
```

## Принципы дизайна

### Цвет

- **Используйте цвет осмысленно**: Цвет должен кодировать данные, а не украшать график.
- **Выделите главное**: Используйте яркий акцентный цвет для ключевого вывода, все остальное сделайте серым.
- **Последовательные данные**: Используйте градиент одного тона (от светлого к темному) для упорядоченных значений.
- **Расходящиеся данные**: Используйте двухцветный градиент с нейтральной серединой для данных с важным центром.
- **Категориальные данные**: Используйте различные тона, максимум 6-8, прежде чем это станет запутанным.
- **Избегайте только красного/зеленого**: 8% мужчин страдают дальтонизмом. Используйте синий/оранжевый как основную пару.

### Типографика

- **Заголовок формулирует инсайт**: «Выручка выросла на 23% за год» лучше, чем «Выручка по месяцам».
- **Подзаголовок добавляет контекст**: Диапазон дат, примененные фильтры, источник данных.
- **Подписи осей читаемы**: Никогда не поворачивайте их на 90 градусов, если этого можно избежать. Лучше сократите или перенесите текст.
- **Метки данных добавляют точность**: Используйте их на ключевых точках, а не на каждом столбце.
- **Аннотации выделяют главное**: Отмечайте конкретные точки текстовыми пояснениями на самом графике.

### Макет

- **Уменьшите «графический мусор»**: Удалите линии сетки, границы и фоны, которые не несут информации.
- **Осмысленная сортировка**: Категории должны быть отсортированы по значению (не по алфавиту), если нет естественного порядка (месяцы, этапы).
- **Соответствующее соотношение сторон**: Временные ряды лучше делать шире (от 3:1 до 2:1); сравнения могут быть более квадратными.
- **Свободное пространство полезно**: Не сжимайте графики вместе. Дайте каждой визуализации место «подышать».

### Точность

- **Столбчатые диаграммы начинаются с нуля**: Всегда. Бары от 95 до 100 преувеличивают разницу в 5%.
- **Линейные графики могут иметь не нулевую базу**: Когда важен именно диапазон колебаний.
- **Согласованные шкалы**: При сравнении нескольких графиков используйте один и тот же диапазон осей.
- **Показывайте неопределенность**: Планки погрешностей, доверительные интервалы или диапазоны, если данные неточны.
- **Подписывайте свои оси**: Читатель не должен гадать, что значат числа.

## Вопросы доступности

### Цветовая слепота

- Никогда не полагайтесь только на цвет для различения рядов данных.
- Добавляйте узоры заливки, разные стили линий (сплошная, пунктирная) или прямые подписи.
- Проверяйте с помощью симулятора цветовой слепоты (например, Coblis, Sim Daltonism).
- Используйте палитру, дружелюбную к дальтоникам: `sns.color_palette("colorblind")`.

### Программы чтения с экрана (Screen Readers)

- Включайте альтернативный текст, описывающий основной вывод графика.
- Предоставляйте таблицу с данными рядом с визуализацией.
- Используйте семантические заголовки и метки.

### Общая доступность

- Достаточный контраст между элементами данных и фоном.
- Минимальный размер шрифта 10pt для подписей, 12pt для заголовков.
- Избегайте передачи информации только через пространственное положение (добавляйте метки).
- Подумайте о печати: работает ли график в черно-белом варианте?

### Чек-лист доступности

Перед публикацией визуализации:
- [ ] График работает без цвета (узоры, подписи или стили линий различают серии).
- [ ] Текст читаем при стандартном масштабе.
- [ ] Заголовок описывает инсайт, а не просто данные.
- [ ] Оси подписаны с указанием единиц измерения.
- [ ] Легенда ясна и расположена так, что не закрывает данные.
- [ ] Указаны источник данных и диапазон дат.
