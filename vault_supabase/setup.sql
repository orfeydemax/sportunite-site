-- Универсальная функция для чтения секретов из Supabase Vault.
-- Выполнить ОДИН РАЗ на сервере Supabase через psql.
-- Уже установлена на supabase.mvprofi.org (16.03.2026).

CREATE OR REPLACE FUNCTION public.get_vault_secrets(secret_names text[])
RETURNS TABLE(name text, secret text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT name, decrypted_secret
  FROM vault.decrypted_secrets
  WHERE name = ANY(secret_names);
$$;

GRANT EXECUTE ON FUNCTION public.get_vault_secrets(text[]) TO service_role;
