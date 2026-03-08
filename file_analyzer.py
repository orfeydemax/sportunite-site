#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
file_analyzer.py — Сканирует диск и обновляет diskData в report.html

Использование:
    python file_analyzer.py C:\
    python file_analyzer.py D:\
    python file_analyzer.py E:\
"""

import os
import sys
import json
import re
from datetime import datetime
from collections import defaultdict

# === Категории файлов ===
CATEGORIES = {
    'GoPro':     {'.360', '.lrv', '.thm'},
    'Video':     {'.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpg', '.mpeg', '.3gp', '.ts', '.m2ts'},
    'Audio':     {'.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus', '.aiff'},
    'Images':    {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif', '.svg', '.ico', '.heic', '.heif', '.raw', '.cr2', '.nef'},
    'E-Books':   {'.pdf', '.epub', '.fb2', '.mobi', '.djvu', '.azw', '.azw3', '.lit'},
    'Documents': {'.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp', '.txt', '.rtf', '.csv'},
    'Archives':  {'.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.iso', '.cab'},
    'Code':      {'.py', '.js', '.ts', '.html', '.css', '.json', '.xml', '.yaml', '.yml', '.java', '.cpp', '.c', '.h', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.sh', '.bat', '.ps1', '.sql'},
    'System':    {'.exe', '.dll', '.sys', '.msi', '.inf', '.reg', '.drv', '.ocx', '.scr'},
}
DEFAULT_CAT = 'Other'
TOP_N = 50  # Сколько топ-файлов сохранять

# Папки, которые пропускаем (мусор, системные)
SKIP_DIRS = {
    '$recycle.bin', 'system volume information', 'windows', 'programdata',
    '$windows.~ws', '$windows.~bt', 'recovery', 'perflogs'
}


def get_category(ext: str) -> str:
    ext_lower = ext.lower()
    for cat, exts in CATEGORIES.items():
        if ext_lower in exts:
            return cat
    return DEFAULT_CAT


def scan_disk(root: str) -> dict:
    print(f"\n🔍 Сканируем: {root}")
    print("   Это может занять несколько минут...\n")

    stats = defaultdict(lambda: {'SizeBytes': 0, 'Count': 0, 'TopFiles': []})
    scanned = 0
    errors = 0

    for dirpath, dirnames, filenames in os.walk(root, onerror=lambda e: None):
        # Пропускаем системные папки
        dirnames[:] = [
            d for d in dirnames
            if d.lower() not in SKIP_DIRS
        ]

        for fname in filenames:
            fpath = os.path.join(dirpath, fname)
            try:
                size = os.path.getsize(fpath)
            except (OSError, PermissionError):
                errors += 1
                continue

            _, ext = os.path.splitext(fname)
            cat = get_category(ext)
            stats[cat]['SizeBytes'] += size
            stats[cat]['Count'] += 1

            # Добавляем в список для топ-файлов
            stats[cat]['TopFiles'].append({'Path': fpath, 'Name': fname, 'Size': size})

            scanned += 1
            if scanned % 5000 == 0:
                print(f"   Обработано файлов: {scanned:,}...")

    # Оставляем только топ-N по размеру
    for cat in stats:
        stats[cat]['TopFiles'].sort(key=lambda x: x['Size'], reverse=True)
        stats[cat]['TopFiles'] = stats[cat]['TopFiles'][:TOP_N]

    print(f"\n✅ Готово! Обработано: {scanned:,} файлов, пропущено с ошибками: {errors}")
    return dict(stats)


def format_bytes(b: int) -> str:
    for unit in ['Bytes', 'KB', 'MB', 'GB', 'TB']:
        if b < 1024:
            return f"{b:.2f} {unit}"
        b /= 1024
    return f"{b:.2f} PB"


def update_report(report_path: str, disk_letter: str, categories: dict):
    """Вставляет/обновляет данные диска в diskData внутри report.html"""
    with open(report_path, 'r', encoding='utf-8') as f:
        html = f.read()

    disk_entry = json.dumps(categories, ensure_ascii=False)

    # Паттерн: ищем существующую запись для этого диска
    existing_key = rf"diskData\['{re.escape(disk_letter)}'\]\s*="
    if re.search(existing_key, html):
        # Заменяем существующую запись
        pattern = rf"(diskData\['{re.escape(disk_letter)}'\]\s*=\s*)(\{{.*?\}});"
        replacement = r'\1' + disk_entry + ';'
        html_new = re.sub(pattern, replacement, html, flags=re.DOTALL)
        if html_new == html:
            print("⚠️  Не удалось автоматически заменить данные. Используем вставку.")
            html_new = None
    else:
        html_new = None

    if html_new is None:
        # Вставляем новую запись после строки `const diskData = {};`
        insert_after = 'const diskData = {};'
        new_line = f"\n        // Данные диска {disk_letter}: (загружены)\n        diskData['{disk_letter}'] = {disk_entry};"
        if insert_after in html:
            html_new = html.replace(insert_after, insert_after + new_line, 1)
        else:
            print("❌ Не найдена точка вставки `const diskData = {};` в report.html!")
            print("   Вставьте вручную перед тегом </script>:")
            print(f"   diskData['{disk_letter}'] = {disk_entry};")
            return

    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(html_new)

    print(f"📄 report.html обновлён: добавлен диск {disk_letter}:")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    root = sys.argv[1].rstrip('\\') + '\\'
    disk_letter = root[0].upper()

    # Путь к report.html рядом со скриптом
    script_dir = os.path.dirname(os.path.abspath(__file__))
    report_path = os.path.join(script_dir, 'report.html')

    if not os.path.exists(report_path):
        print(f"❌ Файл не найден: {report_path}")
        sys.exit(1)

    if not os.path.isdir(root):
        print(f"❌ Диск/папка не найдена: {root}")
        sys.exit(1)

    categories = scan_disk(root)

    # Итог по категориям
    print("\n📊 Результаты:")
    total = 0
    for cat, info in sorted(categories.items(), key=lambda x: -x[1]['SizeBytes']):
        print(f"   {cat:12s}: {info['Count']:6d} файлов, {format_bytes(info['SizeBytes'])}")
        total += info['SizeBytes']
    print(f"   {'ИТОГО':12s}: {format_bytes(total)}")

    # Формируем объект для diskData
    disk_data_obj = {
        'path': root,
        'categories': categories
    }

    update_report(report_path, disk_letter, disk_data_obj)
    print(f"\n🎉 Откройте report.html в браузере и переключитесь на диск {disk_letter}:")
    print(f"   {report_path}\n")


if __name__ == '__main__':
    main()
