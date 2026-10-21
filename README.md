# Gestor Magalu

Painel de gestão para lojas na Magalu (Magazine Luiza), no mesmo formato do Gestor Mercado
Livre: mesmo visual, menu, login e arquitetura. Faz parte da suíte do Hub: mesmo projeto
Supabase, schema **`magalu`**, acesso decidido pelo Hub.

## O que a v1 entrega
- **Dashboard** (`/dashboard`): vendas de hoje, receita, pedidos, ticket, cancelados, SKUs
  ativos/sem estoque e receita por dia (dias de Brasília).
- **Pedidos** (`/pedidos`): espelho `magalu.orders`, período, status e busca.
- **Anúncios** (`/anuncios`): espelho `magalu.skus` (portfólio), filtros de estoque.
- **Configurações** (`/configuracoes`): conectar loja pelo ID Magalu, desconectar,
  sincronizar agora.

## Regras que valem aqui (as mesmas do Gestor ML)
- **Arquitetura de 3 camadas:** página fina (`src/pages`) → `src/features/<x>/` (constantes,
  mapper puro com teste, hook único de fetch) → componentes burros (`src/components/<x>/`).
- **Ausência de dado nunca é zero.** Total de pedido ilegível fica fora da soma e a tela
  diz quantos; estoque não informado não conta como "sem estoque"; valor ausente vira "—".
- **Cancelado não é venda.** `pedidoContaComoVenda` existe em dois lugares
  (`src/features/magalu/vendas.js` e `supabase/functions/magalu-sync/logic.ts`): mexeu num,
  mexa no outro.
- **Leitura paginada com ordem total** (`lerTudo` em `features/magalu/magaluDb.js`): o
  PostgREST corta em 1000 linhas e `.range()` sem ordem estável pula linha.
- **Troca de loja nunca mostra dado da loja anterior**: os hooks guardam a conta de origem.

## Backend
- Migration `supabase/migrations/20261021120000_magalu_baseline.sql`: tabelas
  `magalu_credentials`, `skus`, `orders`, `sync_runs`, `app_config`, `role_modules`, RLS por
  papel + as policies restritivas `suite_acesso_pelo_hub` e `suite_loja_pelo_hub`. Loja
  conectada entra em `hub.lojas` **desativada** (a primeira da plataforma entra ativa).
- Edge `magalu-oauth`: lista lojas liberadas, troca o `code` do ID Magalu, desconecta.
- Edge `magalu-sync`: SKUs e pedidos, paginado, orçamento de 110 s, uma loja que falha não
  derruba as outras. Cron em `supabase/crons.sql` (pedidos a cada 30 min, SKUs 1x/dia),
  autenticado pelo segredo `CRON_SECRET` em `magalu.app_config`.
- Credenciais do app: Edge Function Secret > Hub (`hub.ler_credencial('magalu', ...)`) >
  `app_config`. Nada de credencial com prefixo `VITE_`.
- Função nova = 3 lugares: a pasta, `scripts/functions-list.txt` e `supabase/config.toml`
  (`npm test` confere).

## ⚠️ NÃO VALIDADO contra a documentação oficial da Magalu
O domínio `developers.magalu.com` estava bloqueado na rede do ambiente em que isto foi
escrito. Saíram de busca pública e estão isolados em constantes, para corrigir num lugar só:
- URL de login e token (`id.magalu.com/login`, `id.magalu.com/oauth/token`);
- escopos (`src/features/magalu/magalu.constants.js`);
- de onde sai o identificador da loja no token (`contaDoToken` em `_shared/magalu-api.ts`);
- caminhos `/seller/v1/portfolios/skus` e `/seller/v1/orders` e a paginação `_offset/_limit`;
- nomes de campo de pedido/SKU e os status (os mappers leem vários caminhos e guardam o
  payload cru, então corrigir o mapeamento não exige buscar de novo).
Antes de usar com loja real: conferir cada item acima na doc e rodar uma sincronização.

## Comandos
`npm run dev` · `npm run build` · `npm test` (lista de functions + vitest) ·
`deno test --no-lock --node-modules-dir=none -A supabase/functions/`
