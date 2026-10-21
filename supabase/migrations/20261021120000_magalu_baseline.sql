-- Gestor Magalu: baseline do schema `magalu` (banco unificado da suíte, mesmo projeto do Hub).
--
-- Mesmo desenho do Gestor ML:
--   * o Hub decide quem entra (suite_acesso_pelo_hub) e quais lojas cada pessoa vê
--     (suite_loja_pelo_hub);
--   * o papel (admin / financeiro / colaborador) deriva do Hub (magalu.papel_atual);
--   * o navegador só LÊ; quem grava são as Edge Functions (service_role, que não passa por RLS);
--   * tokens OAuth nunca saem do servidor: magalu_credentials não tem policy de leitura.
--
-- Requer no Hub: baseline, 20261016120000_suite_lojas_por_pessoa.sql e a migration que
-- cadastra o sistema `magalu` (20261021120000_suite_magalu.sql do Hub). Aplique o Hub antes.
--
-- "Conta" aqui é a LOJA autorizada no ID Magalu (tenant). A coluna chama-se account_id.

create schema if not exists magalu;
grant usage on schema magalu to authenticated, service_role;

-- Configuração da instalação (fallback das credenciais do app; o Hub e o Secret vencem).
create table magalu.app_config (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

-- Uma linha por loja autorizada.
create table magalu.magalu_credentials (
  account_id    text primary key,
  nickname      text,
  access_token  text not null,
  refresh_token text,
  expires_at    timestamptz not null,
  scope         text,
  token_payload jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table magalu.magalu_credentials is
  'Tokens OAuth por loja (tenant do ID Magalu). Só service_role lê: nenhuma policy para authenticated.';

-- Espelho do catálogo (SKUs do portfolio do seller).
create table magalu.skus (
  account_id  text not null,
  sku         text not null,
  title       text,
  status      text,
  price       numeric(14,2),
  list_price  numeric(14,2),
  stock       integer,
  image_url   text,
  payload     jsonb not null default '{}'::jsonb,
  synced_at   timestamptz not null default now(),
  primary key (account_id, sku)
);
create index skus_account_status_idx on magalu.skus (account_id, status);

-- Espelho dos pedidos. Colunas derivadas pela Edge Function; o pedido cru fica em payload.
-- Ausência nunca vira zero: total_amount fica NULL quando o valor do pedido não é legível.
create table magalu.orders (
  account_id   text not null,
  order_id     text not null,
  status       text,
  purchased_at timestamptz,
  total_amount numeric(14,2),
  items_count  integer,
  payload      jsonb not null default '{}'::jsonb,
  synced_at    timestamptz not null default now(),
  primary key (account_id, order_id)
);
create index orders_account_purchased_idx on magalu.orders (account_id, purchased_at desc);
create index orders_account_status_idx on magalu.orders (account_id, status);

-- Registro de cada sincronização (o que rodou, quanto trouxe, se truncou, qual erro).
create table magalu.sync_runs (
  id          bigint generated always as identity primary key,
  account_id  text not null,
  kind        text not null check (kind in ('skus', 'orders')),
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  fetched     integer,
  truncated   boolean not null default false,
  error       text
);
create index sync_runs_account_kind_idx on magalu.sync_runs (account_id, kind, started_at desc);

-- Papel e acessos ---------------------------------------------------------------
create or replace function magalu.papel_atual()
returns text
language sql stable security definer
set search_path to 'pg_catalog'
as $$
  select case
    when not hub.pode_acessar('magalu') then null
    when hub.eh_admin() then 'admin'
    when hub.ve_valores('magalu') then 'financeiro'
    else 'colaborador'
  end;
$$;
revoke all on function magalu.papel_atual() from public, anon;
grant execute on function magalu.papel_atual() to authenticated;

-- Módulos OCULTOS por papel (mesmo contrato do Gestor ML). Ausência = visível.
create table magalu.role_modules (
  papel      text not null check (papel in ('financeiro', 'colaborador')),
  modulo     text not null,
  oculto     boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (papel, modulo)
);
insert into magalu.role_modules (papel, modulo) values
  ('colaborador', 'configuracoes'), ('colaborador', 'pedidos'),
  ('financeiro', 'configuracoes')
on conflict do nothing;

-- RLS --------------------------------------------------------------------------
alter table magalu.app_config         enable row level security;
alter table magalu.magalu_credentials enable row level security;
alter table magalu.skus               enable row level security;
alter table magalu.orders             enable row level security;
alter table magalu.sync_runs          enable row level security;
alter table magalu.role_modules       enable row level security;

grant select on magalu.skus, magalu.orders, magalu.sync_runs, magalu.role_modules to authenticated;
grant insert, update, delete on magalu.role_modules to authenticated;
grant all on all tables in schema magalu to service_role;
-- app_config e magalu_credentials: nenhum grant para authenticated.

create policy skus_leitura on magalu.skus for select to authenticated
  using ((select magalu.papel_atual()) is not null);
create policy sync_runs_leitura on magalu.sync_runs for select to authenticated
  using ((select magalu.papel_atual()) is not null);
-- Pedido carrega valor por transação: mesma régua de /pedidos do Gestor ML.
create policy orders_leitura on magalu.orders for select to authenticated
  using ((select magalu.papel_atual()) in ('admin', 'financeiro'));

create policy role_modules_read on magalu.role_modules for select to authenticated using (true);
create policy role_modules_admin_write on magalu.role_modules for all to authenticated
  using ((select magalu.papel_atual()) = 'admin')
  with check ((select magalu.papel_atual()) = 'admin');

-- Barreira do Hub em TODA tabela do schema (soma-se, nunca afrouxa).
-- ⚠️ Tabela nova em migration futura precisa repetir este laço.
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

-- Lojas pelo Hub: toda tabela com account_id (mesmo laço do suite_loja_pelo_hub do ML).
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

-- Loja nova entra no catálogo do Hub DESATIVADA, na hora da conexão (mesma regra do ML).
-- Catálogo da Magalu ainda vazio -> a primeira entra ativa. Falha no Hub não impede a conexão.
create or replace function magalu.registrar_loja_no_hub()
returns trigger
language plpgsql security definer
set search_path to ''
as $$
begin
  begin
    insert into hub.lojas (sistema_id, conta, nome, ativo)
    select s.id, new.account_id, coalesce(nullif(btrim(new.nickname), ''), 'Loja ' || new.account_id),
           not exists (select 1 from hub.lojas x where x.sistema_id = s.id)
      from hub.sistemas s
     where s.slug = 'magalu'
    on conflict (sistema_id, conta) do nothing;
  exception when others then
    raise warning 'registrar_loja_no_hub(%): %', new.account_id, sqlerrm;
  end;
  return null;
end $$;
revoke all on function magalu.registrar_loja_no_hub() from public, anon, authenticated;

create trigger registrar_loja_no_hub
  after insert on magalu.magalu_credentials
  for each row execute function magalu.registrar_loja_no_hub();

notify pgrst, 'reload schema';
