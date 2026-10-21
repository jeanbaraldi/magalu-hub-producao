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

## O que a v2 acrescentou (22/10/2026) — menu no formato do Gestor ML
Telas que só dependem de pedidos e catálogo: **Vendas Hoje**, **Tarefas**, **Performance**,
**Análise ABC**, **Produtos** (custo por SKU, importação em massa), **Rentabilidade**,
**Lucratividade**, **Impostos** (regime, alíquota, comissão da Magalu, frete %),
**Relatórios**, **Previsões** e **Alertas** (diagnóstico na tela, sem WhatsApp).
- Migration `20261022120000_magalu_gestao.sql`: `sku_costs`, `account_settings`, `tasks`.
- Regras únicas em `src/features/magalu/`: `itens.js` (itens do pedido e agregação por SKU),
  `margem.js` (`calcularMargem` e `curvaAbc`, régua 80/95 da suíte), `useGestaoConfig.js`.
- **A API não devolve comissão nem frete do pedido**: entram como % informado em Impostos.
  Sem custo, comissão ou imposto, a margem é INDISPONÍVEL (com o motivo), nunca zero.
- A receita das telas por SKU soma os ITENS; a de Pedidos/Dashboard soma o total do pedido.
  Podem divergir se o pedido tiver frete/desconto fora dos itens.
- Ainda não feito (depende da API conferida): Campanhas/Ads, Promoções, Perguntas,
  Devoluções, Reclamações, Recebíveis, Estoque Full.

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

## API da Magalu: o que está confirmado e o que não está
`developers.magalu.com` ficou bloqueado na rede do ambiente; o que segue foi conferido em
21/10/2026 pelo conteúdo indexado da doc oficial, não lendo a página.

**Confirmado na doc:**
- login em `id.magalu.com/login` com `choose_tenants=true` (obrigatório para seller), code
  de uso único válido por 10 min, troca e refresh em `id.magalu.com/oauth/token`, access
  token de ~2 h (7200 s);
- o `scope` pedido SOMA aos padrão do app, e os escopos são granulares:
  `open:portfolio-skus-seller:read`, `open:portfolio-prices-seller:read`,
  `open:portfolio-stocks-seller:read`, `open:order-order-seller:read`. O app no ID Magalu
  precisa ter cada um habilitado;
- base `https://api.magalu.com`; as specs ficam em `developers.magalu.com/apis/orders.openapi.yaml`
  e `.../products.openapi.yaml`.

**Relatado por integradores, não está na doc indexada:**
- teto de 5.000 no offset das listas (o sync para como PARCIAL e diz por quê);
- a loja vem na claim `tenant` do access token. Sem tenant a conexão é recusada; `sub` não
  serve (é a pessoa, não a loja).

**Ainda aberto, conferir nas specs antes de usar com loja real:**
- nomes dos parâmetros de paginação (`_offset`/`_limit`) e se a lista de pedidos aceita filtro
  por data (hoje o sync para quando a página inteira já é mais velha que a janela, o que
  pressupõe ordem decrescente);
- campos de pedido e SKU e os status. Preço e estoque têm endpoint próprio
  (`prices`/`stocks`): se a lista de SKUs não os trouxer, a tela de Anúncios mostra
  "não informado", nunca zero. Os mappers guardam o payload cru, então corrigir o
  mapeamento não exige buscar de novo.

## Comandos
`npm run dev` · `npm run build` · `npm test` (lista de functions + vitest) ·
`deno test --no-lock --node-modules-dir=none -A supabase/functions/`
