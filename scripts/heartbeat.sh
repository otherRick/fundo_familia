#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SUPABASE_URL:-}" || -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "::error::Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nos secrets do repositório."
  exit 1
fi

if [[ ! "$SUPABASE_URL" =~ ^https://[a-z0-9-]+\.supabase\.co/?$ ]]; then
  echo "::error::SUPABASE_URL deve ser a URL HTTPS do projeto (*.supabase.co)."
  exit 1
fi

url="${SUPABASE_URL%/}/rest/v1/contributions?select=id&limit=1"

if ! status=$(curl --silent --show-error \
  --output /dev/null \
  --write-out "%{http_code}" \
  --connect-timeout 10 \
  --max-time 30 \
  --retry 2 \
  --retry-delay 5 \
  --retry-all-errors \
  --request GET \
  --header "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  --header "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  "$url"); then
  echo "::error::Falha de rede ao consultar o Supabase. Se o host não resolve, confira se o projeto está pausado e se SUPABASE_URL aponta para o projeto certo."
  exit 1
fi

echo "Supabase respondeu HTTP $status"
if [[ "$status" != "200" ]]; then
  echo "::error::Heartbeat falhou (HTTP $status). Confira o estado do projeto, a chave e a tabela contributions."
  exit 1
fi

echo "::notice::Heartbeat OK — consulta ao banco concluída."
