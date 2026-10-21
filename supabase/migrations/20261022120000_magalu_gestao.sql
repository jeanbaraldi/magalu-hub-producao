-- Gestor Magalu: tabelas de gestão (custos, impostos/comissão e tarefas).
--
-- O que a Magalu não informa (custo do produto, alíquota, comissão combinada) é cadastrado
-- aqui pela pessoa. Sem cadastro, a margem fica INDISPONÍVEL na tela, nunca zero.
-- Mesmas barreiras do baseline: o Hub decide quem entra e quais lojas cada pessoa vê.

-- Custo por SKU (o que a loja paga pelo produto). Valor de dinheiro: só admin/financeiro.
create table if not exists magalu.sku_costs (
  account_id text not null,
  sku        text not null,
  cost       numeric(14,2) not null check (cost >= 0),
  updated_at timestamptz not null default now(),
  primary key (account_id, sku)
);

-- Configuração financeira da loja. NULL = não informado (a tela diz isso, não usa zero).
create table if not exists magalu.account_settings (
  account_id     text primary key,
  tax_regime     text check (tax_regime in ('mei', 'simples', 'presumido', 'real', 'manual')),
  tax_pct        numeric(6,3) check (tax_pct >= 0 and tax_pct < 100),
  commission_pct numeric(6,3) check (commission_pct >= 0 and commission_pct < 100),
  freight_pct    numeric(6,3) check (freight_pct >= 0 and freight_pct < 100),
  updated_at     timestamptz not null default now()
);
comment on column magalu.account_settings.commission_pct is
  'Comissão da Magalu informada pela loja (% sobre a venda). A API não devolve a comissão do pedido.';
comment on column magalu.account_settings.freight_pct is
  'Custo de frete/envio que a loja assume, em % da venda (estimativa informada). NULL = não informado.';

-- Tarefas da operação (mesma ideia da Central de Tarefas do Gestor ML, enxuta).
create table if not exists magalu.tasks (
  id           uuid primary key default gen_random_uuid(),
  account_id   text not null,
  title        text not null check (length(btrim(title)) > 0),
  description  text,
  area         text not null default 'operacao'
               check (area in ('anuncios', 'estoque', 'precificacao', 'pedidos', 'margem', 'operacao')),
  priority     text not null default 'media' check (priority in ('alta', 'media', 'baixa')),
  status       text not null default 'a_fazer' check (status in ('a_fazer', 'fazendo', 'concluida')),
  assignee     text,
  due_date     date,
  sku          text,
  created_by   uuid default auth.uid(),
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists tasks_account_status_idx on magalu.tasks (account_id, status, created_at desc);

create or replace function magalu.tasks_completed_at()
returns trigger language plpgsql set search_path to '' as $$
begin
  if new.status = 'concluida' and (tg_op = 'INSERT' or old.status <> 'concluida') then
    new.completed_at := now();
  elsif new.status <> 'concluida' then
    new.completed_at := null;
  end if;
  return new;
end $$;
drop trigger if exists tasks_completed_at on magalu.tasks;
create trigger tasks_completed_at before insert or update on magalu.tasks
  for each row execute function magalu.tasks_completed_at();

-- RLS ---------------------------------------------------------------------------
alter table magalu.sku_costs        enable row level security;
alter table magalu.account_settings enable row level security;
alter table magalu.tasks            enable row level security;

grant select, insert, update, delete on magalu.sku_costs, magalu.account_settings, magalu.tasks to authenticated;
grant all on magalu.sku_costs, magalu.account_settings, magalu.tasks to service_role;

drop policy if exists sku_costs_financeiro on magalu.sku_costs;
create policy sku_costs_financeiro on magalu.sku_costs for all to authenticated
  using ((select magalu.papel_atual()) in ('admin', 'financeiro'))
  with check ((select magalu.papel_atual()) in ('admin', 'financeiro'));

drop policy if exists account_settings_leitura on magalu.account_settings;
create policy account_settings_leitura on magalu.account_settings for select to authenticated
  using ((select magalu.papel_atual()) in ('admin', 'financeiro'));
drop policy if exists account_settings_escrita on magalu.account_settings;
create policy account_settings_escrita on magalu.account_settings for all to authenticated
  using ((select magalu.papel_atual()) in ('admin', 'financeiro'))
  with check ((select magalu.papel_atual()) in ('admin', 'financeiro'));

drop policy if exists tasks_equipe on magalu.tasks;
create policy tasks_equipe on magalu.tasks for all to authenticated
  using ((select magalu.papel_atual()) is not null)
  with check ((select magalu.papel_atual()) is not null);

-- Telas de valor ficam ocultas para colaborador (mesma régua do Gestor ML).
insert into magalu.role_modules (papel, modulo) values
  ('colaborador', 'vendas'), ('colaborador', 'performance'), ('colaborador', 'analise-abc'),
  ('colaborador', 'rentabilidade'), ('colaborador', 'lucratividade'), ('colaborador', 'impostos'),
  ('colaborador', 'relatorios'), ('colaborador', 'previsoes')
on conflict do nothing;

-- Barreira do Hub (repete o laço do baseline para as tabelas novas; idempotente).
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
