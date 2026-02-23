import subprocess
import sys
import os


def install_package(package):
    print(f"Installing {package}...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])


def install_playwright_browsers():
    print("Installing Playwright browsers...")
    subprocess.check_call([sys.executable, "-m", "playwright", "install"])


def main():
    try:
        # Install browser-use
        install_package("browser-use")

        # Install additional dependencies
        install_package("langchain-openai")
        install_package("python-dotenv")

        # Install playwright if not already (it should be a dep of browser-use but good to ensure)
        install_package("playwright")

        # Install browsers
        install_playwright_browsers()

        print("\nSuccessfully installed browser-use and dependencies!")

    except subprocess.CalledProcessError as e:
        print(f"\nError during installation: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
