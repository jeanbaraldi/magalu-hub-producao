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
`developers.magalu.com` fica bloqueado na rede do ambiente. Em 21/10/2026 o dono enviou um
resumo da doc oficial (índice das 27 especificações, conceitos e padrões). O resumo NÃO traz
os modelos de dados: nomes de campo seguem sem conferência.

**Confirmado na doc:**
- login em `id.magalu.com/login` com `choose_tenants=true` e `state`; code de uso único,
  10 min; troca e refresh em `POST id.magalu.com/oauth/token`; respeitar `expires_in`;
- base `https://api.magalu.com`. Perguntas, conversas e inventário de fulfillment ficam em
  `https://services.magalu.com`; Ads, promoções e financeiro em `api.magalu.com`;
- rotas usadas hoje existem: `GET /seller/v1/portfolios/skus` e `GET /seller/v1/orders`.
  Preço e estoque são POR SKU: `GET /seller/v1/portfolios/prices/{sku}` e `.../stocks/{sku}`;
- paginação `_limit` + `_offset` (limite varia por rota), ou cursor (`_paginate=cursor` e
  seguir `meta.links.next`, sem misturar com offset); ordenação `_sort=campo:asc|desc`;
  filtros `campo__gte`, `__lte`, `__in`, `__like`, só os aceitos pela rota;
- dinheiro = `value`/`amount` ÷ `normalizer`, sem presumir 100 (o mapper já faz assim);
- 429 é limite por seller e módulo; 202 é processamento pendente;
- escopos: SKU/preço/estoque `open:portfolio-{skus,prices,stocks}-seller:read`, pedidos
  `open:order-order-seller:read`, entregas `open:order-delivery-seller:read`, NF-e
  `open:order-invoice-seller:read`, perguntas `services:questions-seller:read`, conversas
  `services:conversations-seller:read`. Ads, promoções e financeiro: escopo não listado no
  resumo. Pedir escopo que o app não tem habilitado pode derrubar o login: só acrescentar
  junto da tela que o usa;
- financeiro: CREDIT soma, DEBIT subtrai, INFORMATIVE fica fora; não deduzir de novo o
  `ABSOLUTE_DISCOUNT` já aplicado ao preço; a análise por pedido exige `order_id` ou um par
  de datas, janela máxima de 15 dias.

**Relatado por integradores, não está na doc:**
- teto de 5.000 no offset (o sync para como PARCIAL e diz por quê). O cursor da doc deve
  resolver isso: trocar depois de ver a resposta real;
- a loja vem na claim `tenant` do access token; sem tenant a conexão é recusada.

**Ainda aberto (precisa da spec YAML ou de uma resposta real):**
- campos de pedido, item e SKU, e os status. O sync pressupõe a lista de pedidos em ordem
  decrescente; dá para pedir `_sort`, mas só com o nome do campo de data certo;
- se a lista de SKUs traz preço e estoque; se não, a tela mostra "não informado". Os mappers
  guardam o payload cru, então corrigir o mapeamento não exige buscar de novo.

**Telas que dependem da API (rotas confirmadas, campos não):** Campanhas (`/seller/v1/ads/...`),
Promoções (`/seller/v1/promotions`), Perguntas (`services.magalu.com/v0/questions`),
Devoluções/Reclamações (SAC: `/seller/v0/tickets`, `.../returns`), Recebíveis
(`/seller/v1/financial-analysis/...`), Estoque fulfillment (`services.magalu.com/logistics/v1/inventories`).

## Comandos
`npm run dev` · `npm run build` · `npm test` (lista de functions + vitest) ·
`deno test --no-lock --node-modules-dir=none -A supabase/functions/`
