-- Gestor Magalu: transações da análise financeira (GET /seller/v1/financial-analysis/orders).
--
-- É a única fonte do custo REAL de frete do vendedor (SHIPPING_SHARE e SHIPPING_COST) e da
-- taxa de intermediação (FEES/PAYMENT_PROCESSING, "MDR"). Os pedidos (/orders) não trazem
-- isso: amounts.freight é o que o COMPRADOR pagou.
-- Escrita só pelo magalu-sync (service_role). Leitura: admin/financeiro (é dinheiro).

create table if not exists magalu.financial_transactions (
  account_id     text not null,
  order_code     text not null,
  identifier     text not null,
  order_date     timestamptz,
  type           text not null check (type in ('CREDIT', 'DEBIT', 'INFORMATIVE')),
  category       text,
  subcategory    text,
  value          numeric(14,2) not null,
  sku            text,
  quantity       integer,
  entity_id      text,
  delivery_id    text,
  status         text,
  description    text,
  batch_id       text,
  transaction_at timestamptz,
  synced_at      timestamptz not null default now(),
  primary key (account_id, order_code, identifier)
);
comment on column magalu.financial_transactions.value is
  'Valor em reais (value ÷ normalizer da Magalu), sempre positivo; o sinal vem de `type`.';
comment on column magalu.financial_transactions.sku is
  'SKU do item. Frete compartilhado vem sem SKU na API: o sync resolve pelo id do item no mesmo pedido. NULL = não resolvido.';
create index if not exists financial_tx_account_sku_idx on magalu.financial_transactions (account_id, sku, order_date desc);
create index if not exists financial_tx_account_date_idx on magalu.financial_transactions (account_id, order_date desc);

alter table magalu.sync_runs drop constraint if exists sync_runs_kind_check;
alter table magalu.sync_runs add constraint sync_runs_kind_check check (kind in ('skus', 'orders', 'financeiro'));

alter table magalu.financial_transactions enable row level security;
grant select on magalu.financial_transactions to authenticated;
grant all on magalu.financial_transactions to service_role;

drop policy if exists financial_tx_leitura on magalu.financial_transactions;
create policy financial_tx_leitura on magalu.financial_transactions for select to authenticated
  using ((select magalu.papel_atual()) in ('admin', 'financeiro'));

-- Custo real medido por SKU nos últimos 60 dias (data da compra).
--   unidades_vendidas: soma das quantidades das transações de venda (SALE).
--   frete: débitos − créditos de SHIPPING_SHARE e SHIPPING_COST.
--   mdr: débitos − créditos de FEES/PAYMENT_PROCESSING.
-- Herda a RLS da tabela (security_invoker): quem não é admin/financeiro não vê nada.
create or replace view magalu.v_custos_reais_sku
with (security_invoker = true) as
select
  account_id,
  sku,
  count(distinct order_code)                                                                  as pedidos,
  sum(quantity) filter (where category = 'SALE')                                              as unidades_vendidas,
  sum(case when type = 'CREDIT' then value else 0 end) filter (where category = 'SALE')       as venda,
  sum(case when type = 'DEBIT' then value when type = 'CREDIT' then -value else 0 end)
    filter (where category in ('SHIPPING_SHARE', 'SHIPPING_COST'))                            as frete,
  sum(case when type = 'DEBIT' then value when type = 'CREDIT' then -value else 0 end)
    filter (where category = 'FEES' and subcategory = 'PAYMENT_PROCESSING')                   as mdr,
  max(order_date)                                                                             as ultima_venda
from magalu.financial_transactions
where sku is not null and order_date >= now() - interval '60 days'
group by account_id, sku;
grant select on magalu.v_custos_reais_sku to authenticated;

-- Barreiras do Hub para a tabela nova (mesmo laço das migrations anteriores; idempotente).
do $$
declare t text;
begin
  for t in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'magalu' and c.relkind in ('r', 'p')
  loop
    execute format('drop policy if exists suite_acesso_pelo_hub on magalu.%I', t);
    execute format(
      'create policy suite_acesso_pelo_hub on magalu.%I as restrictive for all to authenticated
         using ((select hub.pode_acessar(''magalu''))) with check ((select hub.pode_acessar(''magalu'')))', t);
  end loop;
end $$;

do $$
declare t text;
begin
  for t in
    select c.relname
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      join pg_attribute a on a.attrelid = c.oid and a.attname = 'account_id' and not a.attisdropped
     where n.nspname = 'magalu' and c.relkind in ('r', 'p')
  loop
    execute format('drop policy if exists suite_loja_pelo_hub on magalu.%I', t);
    execute format(
      'create policy suite_loja_pelo_hub on magalu.%I as restrictive for all to authenticated
         using ((select hub.sem_filtro_de_loja(''magalu'')) or account_id in (select hub.minhas_lojas(''magalu'')))
         with check ((select hub.sem_filtro_de_loja(''magalu'')) or account_id in (select hub.minhas_lojas(''magalu'')))', t);
  end loop;
end $$;

notify pgrst, 'reload schema';
