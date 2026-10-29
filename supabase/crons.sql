-- Agendamentos do Gestor Magalu. Idempotente.
-- Placeholders trocados pelo instalador: __SUPABASE_URL__, __ANON_KEY__.
-- O segredo do cron é lido de magalu.app_config (CRON_SECRET) por subquery: nunca literal
-- no comando, que fica legível em cron.job.

select cron.unschedule(jobid) from cron.job where jobname = 'magalu-sync-pedidos';
select cron.schedule('magalu-sync-pedidos', '*/30 * * * *', $$
  select net.http_post(
    url := '__SUPABASE_URL__/functions/v1/magalu-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer __ANON_KEY__',
      'x-cron-secret', (select value from magalu.app_config where key = 'CRON_SECRET')),
    body := '{"cron": true, "kind": "orders", "days": 3}'::jsonb,
    timeout_milliseconds := 150000);
$$);

-- Ao vivo: pedidos do dia a cada minuto (o mínimo do pg_cron). Cada rodada leva poucos
-- segundos e só grava pedido que mudou, então o Realtime só dispara com venda nova.
-- O job de 30 min acima segue como rede de segurança dos 3 últimos dias.
select cron.unschedule(jobid) from cron.job where jobname = 'magalu-sync-pedidos-ao-vivo';
select cron.schedule('magalu-sync-pedidos-ao-vivo', '* * * * *', $$
  select net.http_post(
    url := '__SUPABASE_URL__/functions/v1/magalu-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer __ANON_KEY__',
      'x-cron-secret', (select value from magalu.app_config where key = 'CRON_SECRET')),
    body := '{"cron": true, "kind": "orders", "days": 1}'::jsonb,
    timeout_milliseconds := 55000);
$$);

select cron.unschedule(jobid) from cron.job where jobname = 'magalu-sync-skus';
select cron.schedule('magalu-sync-skus', '15 9 * * *', $$
  select net.http_post(
    url := '__SUPABASE_URL__/functions/v1/magalu-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer __ANON_KEY__',
      'x-cron-secret', (select value from magalu.app_config where key = 'CRON_SECRET')),
    body := '{"cron": true, "kind": "skus"}'::jsonb,
    timeout_milliseconds := 150000);
$$);

-- Análise financeira (frete real, intermediação/MDR, tarifas): 1x/dia, pedidos atualizados
-- nos últimos 15 dias (repasse e estorno chegam depois da venda). Backfill inicial: chamar
-- a função com {"kind":"financeiro","days":60}.
select cron.unschedule(jobid) from cron.job where jobname = 'magalu-sync-financeiro';
select cron.schedule('magalu-sync-financeiro', '35 9 * * *', $$
  select net.http_post(
    url := '__SUPABASE_URL__/functions/v1/magalu-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer __ANON_KEY__',
      'x-cron-secret', (select value from magalu.app_config where key = 'CRON_SECRET')),
    body := '{"cron": true, "kind": "financeiro", "days": 15}'::jsonb,
    timeout_milliseconds := 150000);
$$);
