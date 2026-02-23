import os
import shutil

ROOT_DIR = r"D:\MVProfi\AI агентство\Разработка приложений"


def get_newest_mtime(dir_path):
    """Возвращает время изменения самого нового файла в директории или время изменения самого файла."""
    max_time = 0
    if os.path.isfile(dir_path):
        return os.path.getmtime(dir_path)
    for root, _, files in os.walk(dir_path):
        for file in files:
            try:
                t = os.path.getmtime(os.path.join(root, file))
                if t > max_time:
                    max_time = t
            except OSError:
                pass
    return max_time


# Сбор директорий всех проектов
projects = []
for entry in os.listdir(ROOT_DIR):
    full_path = os.path.join(ROOT_DIR, entry)
    if os.path.isdir(full_path):
        projects.append(full_path)

print(f"Обнаружено проектов для сканирования: {len(projects)}")

newest_gemini = {"time": 0, "path": None}
newest_skills = {}  # skill_name -> {"time": 0, "path": None}

# Этап 1: Собираем информацию о новейших версиях по всем проектам
print("\n--- ЭТАП 1: Сканирование всех проектов (поиск самых новых версий) ---")
for project in projects:
    project_gemini = os.path.join(project, "GEMINI.md")
    project_skills_dir = os.path.join(project, ".agent", "skills")

    # Проверка GEMINI.md
    if os.path.exists(project_gemini):
        mtime = os.path.getmtime(project_gemini)
        if mtime > newest_gemini["time"]:
            newest_gemini["time"] = mtime
            newest_gemini["path"] = project_gemini

    # Проверка скиллов (.agent/skills)
    if os.path.exists(project_skills_dir):
        for skill_name in os.listdir(project_skills_dir):
            skill_path = os.path.join(project_skills_dir, skill_name)
            if not os.path.isdir(skill_path):
                continue

            skill_mtime = get_newest_mtime(skill_path)
            if (
                skill_name not in newest_skills
                or skill_mtime > newest_skills[skill_name]["time"]
            ):
                newest_skills[skill_name] = {"time": skill_mtime, "path": skill_path}

if newest_gemini["path"]:
    gemini_project_name = os.path.basename(os.path.dirname(newest_gemini["path"]))
    print(f"[ФАЙЛ GEMINI] Самая актуальная версия найдена в: {gemini_project_name}")
else:
    print("[ФАЙЛ GEMINI] Файл не найден ни в одном проекте.")

print("\nСамые актуальные версии скиллов найдены в проектах:")
for name, data in newest_skills.items():
    skill_project_name = os.path.basename(
        os.path.dirname(os.path.dirname(os.path.dirname(data["path"])))
    )
    print(f"- {name}: {skill_project_name}")

# Этап 2: Распространение новейших версий во все проекты
print("\n--- ЭТАП 2: Обновление проектов (распространение новейших файлов) ---")

for project in projects:
    project_name = os.path.basename(project)
    project_gemini = os.path.join(project, "GEMINI.md")
    project_skills_dir = os.path.join(project, ".agent", "skills")

    # 1. Синхронизуем GEMINI.md
    if newest_gemini["path"] and project_gemini != newest_gemini["path"]:
        needs_update = True
        if os.path.exists(project_gemini):
            # Проверяем не новее ли или такая же дата
            if os.path.getmtime(project_gemini) >= newest_gemini["time"]:
                needs_update = False

        if needs_update:
            print(f"[ОБНОВЛЕНИЕ GEMINI] -> {project_name}")
            shutil.copy2(newest_gemini["path"], project_gemini)

    # 2. Синхронизуем скиллы
    for skill_name, data in newest_skills.items():
        best_skill_path = data["path"]
        target_skill_path = os.path.join(project_skills_dir, skill_name)

        # Если это тот самый проект - пропускаем
        if target_skill_path == best_skill_path:
            continue

        needs_update = True
        if os.path.exists(target_skill_path):
            target_mtime = get_newest_mtime(target_skill_path)
            # Если целевой скилл имеет ту же или более новую дату (что маловероятно, но вдруг), то не заменяем
            if target_mtime >= data["time"]:
                needs_update = False

        if needs_update:
            os.makedirs(project_skills_dir, exist_ok=True)
            if os.path.exists(target_skill_path):
                print(f"[ОБНОВЛЕНИЕ SKILL] '{skill_name}' -> {project_name}")
                shutil.rmtree(target_skill_path)
            else:
                print(f"[ДОБАВЛЕНИЕ SKILL] '{skill_name}' -> {project_name}")
            shutil.copytree(best_skill_path, target_skill_path)

print("\n--- Синхронизация успешно завершена! ---")
