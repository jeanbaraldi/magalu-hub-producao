-- Vendas Hoje "ao vivo": a tela assina mudanças em magalu.orders e repinta assim que o
-- sync grava um pedido. Sem a tabela na publicação, o subscribe() "funciona" e nunca
-- chega evento (mesma armadilha do Gestor ML com promotion_history). Idempotente.
-- O Realtime respeita a RLS da tabela (orders_leitura + policies da suíte).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'magalu' and tablename = 'orders'
     ) then
    alter publication supabase_realtime add table magalu.orders;
  end if;
end $$;
