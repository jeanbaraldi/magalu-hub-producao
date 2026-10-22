-- Custo real por SKU em 12 meses (era 60 dias): a maioria dos anúncios não vende todo mês e
-- ficava sem medição. Acrescenta a comissão percentual (COMMISSION/*) cobrada nas vendas,
-- para SKU que não vendeu nos últimos 30 dias.
-- Herda a RLS da tabela (security_invoker): só admin/financeiro veem.
drop view if exists magalu.v_custos_reais_sku;
create view magalu.v_custos_reais_sku
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
  sum(case when type = 'DEBIT' then value when type = 'CREDIT' then -value else 0 end)
    filter (where category = 'COMMISSION')                                                    as comissao,
  max(order_date)                                                                             as ultima_venda
from magalu.financial_transactions
where sku is not null and order_date >= now() - interval '365 days'
group by account_id, sku;
grant select on magalu.v_custos_reais_sku to authenticated;
notify pgrst, 'reload schema';
