import argparse
import asyncio
import os

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from browser_use import Agent

# Загрузка переменных окружения
load_dotenv()


async def run_task(url, task_description, headless=False):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("Ошибка: OPENAI_API_KEY не найден в переменных окружения.")
        print("Пожалуйста, установите его в вашем файле .env или окружении.")
        return

    # Инициализация LLM
    llm = ChatOpenAI(model="gpt-4o", temperature=0.0)

    # Инициализация агента
    # Примечание: browser-use Agent может обрабатывать инициализацию браузера внутри или через конфиг Browser
    # Мы можем передать initial_url в описании задачи или если библиотека поддерживает это напрямую.
    # Судя по документации, 'open https://...' это распространенный паттерн.
    # Мы добавим "Перейди на {url} и " к задаче, если url предоставлен.

    full_task = task_description
    if url:
        full_task = f"Перейди на {url}. {task_description}"

    print(f"Запуск задачи: {full_task}")

    try:
        agent = Agent(
            task=full_task,
            llm=llm,
        )

        # Запуск агента
        result = await agent.run()

        print("\nЗадача выполнена.")
        print("Результат:")
        print(result)

    except Exception as e:
        print(f"Произошла ошибка: {e}")


def main():
    parser = argparse.ArgumentParser(
        description="Запуск задачи автоматизации браузера."
    )
    parser.add_argument("--url", help="Начальный URL для браузера.")
    parser.add_argument("--task", required=True, help="Описание задачи для выполнения.")
    parser.add_argument(
        "--headless", action="store_true", help="Запуск в безголовом режиме."
    )

    args = parser.parse_args()

    asyncio.run(run_task(args.url, args.task, args.headless))


if __name__ == "__main__":
    main()
