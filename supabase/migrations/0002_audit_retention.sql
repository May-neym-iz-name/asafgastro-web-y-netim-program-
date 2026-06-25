-- Audit log saklama: 90 günden eski kayıtları temizleyen fonksiyon.
-- Supabase'i şişirmemek için periyodik çağrılır (aşağıdaki pg_cron opsiyonel).

create or replace function public.prune_audit_log(gun int default 90)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  silinen integer;
begin
  delete from public.audit_log where created_at < now() - (gun || ' days')::interval;
  get diagnostics silinen = row_count;
  return silinen;
end;
$$;

-- OPSİYONEL: pg_cron ile günlük otomatik temizlik (Supabase'de pg_cron eklentisi
-- etkinse). Etkin değilse bu bloğu atlayın; fonksiyonu elle de çağırabilirsiniz:
--   select public.prune_audit_log(90);
--
-- create extension if not exists pg_cron;
-- select cron.schedule('audit-prune-daily', '0 3 * * *', $$select public.prune_audit_log(90)$$);
