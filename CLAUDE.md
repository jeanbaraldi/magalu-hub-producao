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
- **Comissão vem da Magalu** em cada item do pedido; o % de Impostos só cobre item sem ela.
  Frete fica como % informado. Sem custo, comissão ou imposto, a margem é INDISPONÍVEL
  (com o motivo), nunca zero.
- A receita das telas por SKU soma os ITENS; a de Pedidos/Dashboard soma o total do pedido.
  Podem divergir se o pedido tiver frete/desconto fora dos itens.
- Ainda não feito (depende da API conferida): Campanhas/Ads, Promoções, Perguntas,
  Devoluções, Reclamações, Recebíveis, Estoque Full.

## Vendas Hoje "ao vivo" (24/10/2026)
Mesmo formato do Ao vivo da Shopee: cabeçalho azul com receita do dia, variação vs ontem até a
mesma hora, tiles Pedidos/Unidades/Ticket/Última venda, e barras por hora Passado/Agora/Futuro.
- **Ao vivo de verdade:** com a tela aberta, `useVendasHojeData` chama o `magalu-sync`
  (`kind: orders`, `days: 1`) ao abrir e a cada 2 min (o cron só roda a cada 30 min); o botão
  Atualizar força a busca. Throttle por loja em memória do módulo, sem sobrepor buscas.
- **Realtime** em `magalu.orders` (migration `20261024120000`): pedido gravado pelo sync repinta
  em ~1,5 s. A releitura do espelho a cada 30 s é a rede de segurança se a publicação faltar.
- Erro do sync vem DENTRO de um 200 por loja (`erroDoSync`): a tela diz e segue mostrando o espelho.
- `dispararSync` (`magaluDb.js`) é a chamada única ao `magalu-sync`, usada também em Configurações.

## Anúncios no formato do Gestor ML (24/10/2026)
`/anuncios`: faixa de resumo, abas Todos/Ativos/Com custo/Sem custo/Não publicados (sub-filtros
em Ativos), busca por título/SKU/marca, ordenação, visão Grade ou Famílias (`payload.group.id`),
e card com fotos, status, Full, vendidos 30d, preço com desconto, estoque e **margem por
unidade no preço atual** (`margemUnitaria` → `calcularMargem`, a regra única).
- Comissão: taxa REAL das vendas de 30 dias do SKU (comissão ÷ receita, só com todos os itens
  completos); sem ela, o % configurado em Impostos. Ads da Magalu não integrado ("não integrado").
- Sem custo cadastrado a margem é indisponível e o card pede o cadastro (em `/produtos`).
  Sem papel financeiro/admin o bloco diz que o acesso não inclui custos.
- O hook lê só os campos do payload que o card usa (alias no select): o payload inteiro
  passa de 5 MB numa loja de 2.300 SKUs.
- "Sincronizar com a Magalu" roda o `magalu-sync` `kind: skus`; rodada cortada pelo tempo é PARCIAL.

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

## API da Magalu: conferida nas specs oficiais (21/10/2026)
As 27 specs ficam em `developers.magalu.com/apis/<nome>.openapi.yaml` (índice em
`/apis/index.json`, resumo para agentes em `/llms.txt`). Leia a spec antes de mexer num campo.

**Login (`magalu-oauth`, `_shared/magalu-api.ts`):**
- troca do code em `POST id.magalu.com/oauth/token` em **JSON**; renovação no mesmo endpoint
  em **`application/x-www-form-urlencoded`**; token de ~7200 s, refresh novo a cada renovação;
- a resposta do token NÃO traz a loja: ela vem de **`GET /seller/v1/portfolios/me`**
  (`tenant.id` = `account_id`, `seller.name` = nome). Claims do JWT são só plano B.

**Pedidos (`GET /seller/v1/orders`):**
- chave `id` (UUID); `code` é o número que o comprador vê (a tela mostra o `code`);
- status do pedido: `new` (pagamento não aprovado, NÃO é venda), `approved`, `cancelled`,
  `finished` (pode ter entrega cancelada). Entrega tem status próprio (`new`, `approved`,
  `invoiced`, `shipped`, `delivered`, `cancelled`, `frozen`);
- valores são INTEIROS com `normalizer` ao lado: `amounts.total / amounts.normalizer`.
  Objeto sem normalizer é ilegível (null), nunca se presume 100;
- itens em `deliveries[].items[]`: `info.sku`, `info.name`, `quantity`,
  `unit_price {value, normalizer}`, `amounts.total`, **`amounts.commission`** (comissão real);
- receita do item = `unit_price × quantity`; entrega `cancelled` fica fora da receita, e o
  `total_amount` do pedido soma só as entregas ativas;
- a margem usa a comissão que a Magalu informa por item. O % de Impostos só entra num SKU em
  que algum item veio sem comissão;
- filtros `updated_at__gte` (o sync usa: pega pedido novo e mudança de status) e
  `purchased_at__gte`; `_sort` só aceita `purchased_at:asc|desc`.

**Produtos (`GET /seller/v1/portfolios/skus`, máx. 100 por página):**
- campos `sku`, `title`, `status` (`PUBLISHED`, `UNPUBLISHED`, `BLOCKED`, `UNDER_REVIEW`,
  `DELETING`, `DELETED`), `images[].reference`. A lista NÃO traz preço nem estoque;
- preço em `GET /prices/{sku}` (por canal: `price`, `list_price`, `normalizer`) e estoque em
  `GET /stocks/{sku}` (por canal e CD; soma só `type=AVAILABLE`, `RESERVED` não é vendável).
  Canal Magalu de produção: `9fe0d853-732b-4e4a-a0b0-cff988ed043d`;
- o sync grava preço/estoque à parte e só o que foi lido: nunca apaga um valor conhecido com
  null. SKU sem leitura deixa a rodada PARCIAL e diz quantos.

**Padrões gerais:** paginação `_limit` + `_offset` (a API pode devolver menos que o pedido:
vale `meta.page.limit`) ou cursor (`_paginate=cursor`, `meta.links.next`); 429 é limite por
seller e módulo; teto de 5.000 no offset relatado por integradores (o sync para como PARCIAL).

**Telas que faltam e as specs delas:** Campanhas (`campaign.ads`, `metric.ads`,
`financial.ads`), Promoções (`promotions`), Perguntas (`questions`, em `services.magalu.com`),
Devoluções/Reclamações (`sac.yaml`), Recebíveis (`financial-analysis`: CREDIT soma, DEBIT
subtrai, INFORMATIVE fora, janela máx. 15 dias), Estoque fulfillment (`stock`). Cada uma pede
escopo próprio: só acrescentar o escopo junto da tela, porque escopo não habilitado no app
pode derrubar o login.

## Comandos
`npm run dev` · `npm run build` · `npm test` (lista de functions + vitest) ·
`deno test --no-lock --node-modules-dir=none -A supabase/functions/`
