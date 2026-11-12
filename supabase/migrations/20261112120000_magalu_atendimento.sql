-- Atendimento: espelho de perguntas, protocolos do SAC e conversas da Magalu, lido pela aba
-- Atendimento do Hub. Quem grava é a edge magalu-atendimento (service_role); o navegador só lê.
--
-- Fontes (specs oficiais, 12/11/2026):
--   perguntas  GET services.magalu.com/v0/questions          (escopo services:questions-seller:read)
--   SAC        GET api.magalu.com/seller/v0/tickets          (open:tickets-seller:read)
--              GET .../tickets/{id}/messages                 (open:ticket-messages-seller:read)
--   conversas  GET services.magalu.com/v0/conversations      (services:conversations-seller:read)
--              GET .../conversations/{id}/messages
-- O `payload` guarda a resposta crua: o que a tela ainda não usa não se perde.

create table if not exists magalu.questions (
  account_id    text not null,
  id            text not null,
  status        text,                -- NEW, WAITING_MODERATION, REJECTED, WAITING_RESPONSE, RESPONSE_REJECTED, APPROVED, DELETED
  sku           text,
  product_name  text,
  product_url   text,
  product_img   text,
  question_text text,
  asker_name    text,
  asked_at      timestamptz,
  answer_text   text,
  answered_at   timestamptz,
  payload       jsonb not null,
  synced_at     timestamptz not null default now(),
  primary key (account_id, id)
);
create index if not exists questions_status_idx on magalu.questions (account_id, status, asked_at);

create table if not exists magalu.tickets (
  account_id     text not null,
  id             text not null,
  protocol       text,
  type           text,               -- shipping, cancellation, payment, general, exchange, ...
  reason         text,
  origin         text,
  status         text,               -- waiting_seller, waiting_customer, ..., closed
  closed         boolean,
  due_date       timestamptz,        -- a API manda sem fuso; gravado como UTC (prazo redondo 11:00 = 08:00 BRT)
  order_id       text,
  order_code     text,
  items          jsonb,
  created_at_ml  timestamptz,
  updated_at_ml  timestamptz,
  messages_synced_at timestamptz,     -- quando as mensagens deste protocolo foram lidas por último
  payload        jsonb not null,
  synced_at      timestamptz not null default now(),
  primary key (account_id, id)
);
create index if not exists tickets_status_idx on magalu.tickets (account_id, status, due_date);

create table if not exists magalu.ticket_messages (
  account_id        text not null,
  ticket_id         text not null,
  id                text not null,
  sender_type       text,            -- customer, seller, channel
  sender_name       text,
  destination       text,            -- customer, seller, channel
  message           text,
  sent_at           timestamptz,
  moderation_status text,
  attachments       jsonb,
  payload           jsonb not null,
  synced_at         timestamptz not null default now(),
  primary key (account_id, ticket_id, id)
);

create table if not exists magalu.conversations (
  account_id          text not null,
  id                  text not null,
  status              text,          -- OPENED, CLOSED
  customer_name       text,
  customer_ref        text,
  unread_from_count   integer,
  last_interaction_at timestamptz,
  last_from_type      text,          -- CUSTOMER ou SELLER: quem falou por último
  last_message_text   text,
  messages_synced_at  timestamptz,
  payload             jsonb not null,
  synced_at           timestamptz not null default now(),
  primary key (account_id, id)
);
create index if not exists conversations_status_idx on magalu.conversations (account_id, status, last_interaction_at);

create table if not exists magalu.conversation_messages (
  account_id        text not null,
  conversation_id   text not null,
  id                text not null,
  from_type         text,            -- CUSTOMER, SELLER (null quando a API não informa)
  from_name         text,
  content           text,
  sent_at           timestamptz,
  moderation_status text,
  payload           jsonb not null,
  synced_at         timestamptz not null default now(),
  primary key (account_id, conversation_id, id)
);

-- RLS ---------------------------------------------------------------------------
alter table magalu.questions             enable row level security;
alter table magalu.tickets               enable row level security;
alter table magalu.ticket_messages       enable row level security;
alter table magalu.conversations         enable row level security;
alter table magalu.conversation_messages enable row level security;

grant select on magalu.questions, magalu.tickets, magalu.ticket_messages,
  magalu.conversations, magalu.conversation_messages to authenticated;
grant all on magalu.questions, magalu.tickets, magalu.ticket_messages,
  magalu.conversations, magalu.conversation_messages to service_role;

do $$
declare t text;
begin
  foreach t in array array['questions', 'tickets', 'ticket_messages', 'conversations', 'conversation_messages'] loop
    execute format('drop policy if exists %I on magalu.%I', t || '_leitura', t);
    execute format('create policy %I on magalu.%I for select to authenticated using ((select magalu.papel_atual()) is not null)', t || '_leitura', t);
  end loop;
end $$;

-- Barreira do Hub (mesmo laço das migrations anteriores; idempotente).
do $$
declare t text;
begin
  foreach t in array array['questions', 'tickets', 'ticket_messages', 'conversations', 'conversation_messages'] loop
    execute format('drop policy if exists suite_acesso_pelo_hub on magalu.%I', t);
    execute format(
      'create policy suite_acesso_pelo_hub on magalu.%I as restrictive for all to authenticated
         using ((select hub.pode_acessar(''magalu''))) with check ((select hub.pode_acessar(''magalu'')))', t);
    execute format('drop policy if exists suite_loja_pelo_hub on magalu.%I', t);
    execute format(
      'create policy suite_loja_pelo_hub on magalu.%I as restrictive for all to authenticated
         using ((select hub.sem_filtro_de_loja(''magalu'')) or account_id in (select hub.minhas_lojas(''magalu'')))
         with check ((select hub.sem_filtro_de_loja(''magalu'')) or account_id in (select hub.minhas_lojas(''magalu'')))', t);
  end loop;
end $$;

notify pgrst, 'reload schema';
