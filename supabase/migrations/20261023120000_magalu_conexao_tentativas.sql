-- Registro de cada tentativa de conectar loja (troca do code do ID Magalu).
-- Existe para diagnosticar falhas sem depender do log das funções: quem conecta
-- vê o erro na tela, e quem dá suporte vê aqui. Nunca guarda token.
create table if not exists magalu.conexao_tentativas (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),
  etapa text not null,          -- sessao, config, troca, loja, gravar, ok
  status_http int,
  redirect_uri text,
  detalhe jsonb
);
alter table magalu.conexao_tentativas enable row level security;
-- Só service_role escreve e lê (sem policy para authenticated).
revoke all on magalu.conexao_tentativas from anon, authenticated;
