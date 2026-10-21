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
