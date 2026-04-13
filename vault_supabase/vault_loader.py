"""
vault_loader.py — универсальный модуль загрузки секретов из Supabase Vault.

Использование в любом проекте:
  1. Добавить в .env: SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY
  2. Вызвать load_secrets_to_env(mapping) ПЕРЕД инициализацией конфига

Пример маппинга:
  VAULT_SECRETS_MAP = {
      "MY_SECRET_NAME": "MY_ENV_VAR",
  }
"""

import os
import logging

logger = logging.getLogger(__name__)


def load_secrets_to_env(mapping: dict = None) -> bool:
    """
    Загружает секреты из Supabase Vault через RPC и прописывает их в os.environ.

    Args:
        mapping: dict вида {"vault_secret_name": "ENV_VAR_NAME", ...}
                 Если None — использует VAULT_SECRETS_MAP из этого файла.

    Returns:
        True — если хотя бы один секрет загружен, False — при ошибке.
    """
    if mapping is None:
        mapping = VAULT_SECRETS_MAP

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        logger.warning(
            "[Vault] SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY не заданы. "
            "Пропускаю загрузку из Vault."
        )
        return False

    try:
        import requests

        secret_names = list(mapping.keys())
        url = f"{supabase_url}/rest/v1/rpc/get_vault_secrets"
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json",
        }

        resp = requests.post(
            url,
            headers=headers,
            json={"secret_names": secret_names},
            timeout=10,
        )
        resp.raise_for_status()

        secrets = resp.json()
        if not isinstance(secrets, list):
            logger.warning(f"[Vault] Неожиданный формат ответа: {secrets}")
            return False

        loaded = []
        for item in secrets:
            vault_name = item.get("name")
            secret_value = item.get("secret")
            if vault_name and secret_value and vault_name in mapping:
                env_name = mapping[vault_name]
                os.environ[env_name] = secret_value
                loaded.append(f"{vault_name}→{env_name}")

        if loaded:
            logger.info(f"[Vault] Загружены секреты: {', '.join(loaded)}")
            return True
        else:
            logger.warning("[Vault] Ни один секрет не найден. Проверьте имена в Vault.")
            return False

    except Exception as e:
        logger.error(
            f"[Vault] Ошибка загрузки секретов: {e}. "
            "Продолжаю с переменными из .env."
        )
        return False


# ─────────────────────────────────────────────
# МАППИНГ: замени на свои секреты
# "имя секрета в Vault" → "имя переменной в приложении"
# ─────────────────────────────────────────────
VAULT_SECRETS_MAP = {
    # "VAULT_SECRET_NAME": "APP_ENV_VAR_NAME",
}
