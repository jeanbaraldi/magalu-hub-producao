#!/usr/bin/env bash
# Guard das 3 listas de edge functions (hand-off 2026-08-25, causa raiz):
#   1. pastas em supabase/functions/         — o que EXISTE
#   2. scripts/functions-list.txt            — o que os instaladores DEPLOYAM
#   3. [functions.X] no supabase/config.toml — com que verify_jwt sobe
# Qualquer divergência sai com 1 (roda dentro do `npm test`).
# Nota não é verificada; script é — foi assim que 9 functions ficaram de fora.
set -uo pipefail
cd "$(dirname "$0")/.."

FAIL=0
FOLDERS=$(ls supabase/functions | grep -v '^_' | sort)
LIST=$(grep -v '^\s*#' scripts/functions-list.txt | grep -v '^\s*$' | sort)

# pasta ↔ lista de deploy
for f in $FOLDERS; do
  echo "$LIST" | grep -qx "$f" || { echo "✗ '$f' existe em supabase/functions/ mas FALTA em scripts/functions-list.txt"; FAIL=1; }
done
for f in $LIST; do
  echo "$FOLDERS" | grep -qx "$f" || { echo "✗ '$f' está em scripts/functions-list.txt mas NÃO tem pasta em supabase/functions/"; FAIL=1; }
done

# pasta ↔ config.toml (toda function precisa declarar verify_jwt explicitamente)
for f in $FOLDERS; do
  grep -q "^\[functions\.$f\]" supabase/config.toml || { echo "✗ '$f' sem bloco [functions.$f] no supabase/config.toml (verify_jwt implícito = true!)"; FAIL=1; }
done

if [ "$FAIL" -ne 0 ]; then
  echo ""
  echo "Listas de edge functions divergentes. Corrija os 3 lugares:"
  echo "  supabase/functions/<nome>/ · scripts/functions-list.txt · supabase/config.toml"
  exit 1
fi
echo "✓ check-functions-list: $(echo "$FOLDERS" | wc -l | tr -d ' ') functions consistentes nas 3 listas"

# Duas migrations com a mesma versão quebram o `supabase db push` de instalação
# nova (PK de schema_migrations) — já aconteceu com 20260917000001.
DUP=$(ls supabase/migrations | grep -E '^[0-9]+_' | cut -d_ -f1 | sort | uniq -d)
if [ -n "$DUP" ]; then
  echo "✗ Versão de migration repetida: $DUP — renomeie uma delas para versão livre."
  exit 1
fi
