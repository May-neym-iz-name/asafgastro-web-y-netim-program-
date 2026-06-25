-- Asaf Gastro Web Yönetim — başlangıç şeması
-- Rol bazlı yetkilendirme (RBAC) + senkron tedarikçi fiyat verisi + FX ayarları
-- + katalog + audit log. RLS politikaları izinleri DB seviyesinde zorlar.
-- Uygulama runtime'da yalnız publishable (anon) key + Auth kullanır.

-- =========================================================
-- 1) Roller & İzinler (RBAC)
-- =========================================================
create table if not exists public.roles (
  id          bigint generated always as identity primary key,
  ad          text not null unique,
  aciklama    text
);

create table if not exists public.role_permissions (
  role_id     bigint not null references public.roles(id) on delete cascade,
  izin        text not null,
  primary key (role_id, izin)
);

-- Auth kullanıcısına bağlı profil (rol ataması)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  ad_soyad    text,
  role_id     bigint references public.roles(id),
  aktif       boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Giriş yapan kullanıcının bir izne sahip olup olmadığını döndürür.
create or replace function public.has_permission(perm text)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.profiles p
    join public.role_permissions rp on rp.role_id = p.role_id
    where p.id = auth.uid() and p.aktif and rp.izin = perm
  );
$$;

-- =========================================================
-- 2) Senkron tedarikçi fiyat verisi (uygulamanın kendi verisi)
--    Tedarikçi liste fiyatı + iskonto tüm kullanıcılar arasında senkron.
-- =========================================================
create table if not exists public.supplier_prices (
  id                bigint generated always as identity primary key,
  varyasyon_id      bigint,
  stok_kodu         text,
  tedarikci_id      bigint,
  liste_fiyati      numeric(14,4),
  para_birimi       text not null default 'TRY',
  iskonto_orani     numeric(6,3),         -- yüzde
  net_alis          numeric(14,4),        -- hesaplanan
  updated_by        uuid references auth.users(id),
  updated_at        timestamptz not null default now(),
  unique (varyasyon_id),
  unique (stok_kodu)
);
create index if not exists idx_supplier_prices_tedarikci on public.supplier_prices(tedarikci_id);

-- =========================================================
-- 3) FX ayarları (alış/satış kaynağı + marjlar) — tekil satır
-- =========================================================
create table if not exists public.fx_settings (
  id            int primary key default 1,
  alis_kaynak   text not null default 'TCMB',   -- TCMB | DENIZBANK
  satis_kaynak  text not null default 'TCMB',
  marjlar       jsonb not null default '{}'::jsonb,
  updated_at    timestamptz not null default now(),
  constraint fx_settings_singleton check (id = 1)
);

-- =========================================================
-- 4) Tedarikçi katalogları (PDF) — meta; dosyalar Storage'da
-- =========================================================
create table if not exists public.catalogs (
  id            bigint generated always as identity primary key,
  tedarikci_id  bigint,
  ad            text not null,
  storage_path  text not null,            -- Supabase Storage yolu
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

-- =========================================================
-- 5) Audit log (özellikle fiyat değişiklikleri)
-- =========================================================
create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users(id),
  islem       text not null,              -- ör. 'fiyat.guncelle'
  varlik      text,                       -- ör. 'supplier_prices'
  detay       jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_audit_created on public.audit_log(created_at desc);

-- =========================================================
-- 6) RLS politikaları
-- =========================================================
alter table public.roles            enable row level security;
alter table public.role_permissions enable row level security;
alter table public.profiles         enable row level security;
alter table public.supplier_prices  enable row level security;
alter table public.fx_settings      enable row level security;
alter table public.catalogs         enable row level security;
alter table public.audit_log        enable row level security;

-- Referans veriler: giriş yapan herkes okur
create policy roles_read   on public.roles            for select to authenticated using (true);
create policy rp_read      on public.role_permissions for select to authenticated using (true);
create policy fx_read      on public.fx_settings       for select to authenticated using (true);
create policy cat_read     on public.catalogs          for select to authenticated using (true);

-- Profiller: kendi profilini herkes görür; tümünü kullanıcı yönetenler görür
create policy prof_self    on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_permission('kullanici.yonet'));
create policy prof_admin   on public.profiles for all to authenticated
  using (public.has_permission('kullanici.yonet'))
  with check (public.has_permission('kullanici.yonet'));

-- Roller/izinler: yalnız kullanıcı yönetenler değiştirir
create policy roles_admin  on public.roles for all to authenticated
  using (public.has_permission('kullanici.yonet')) with check (public.has_permission('kullanici.yonet'));
create policy rp_admin     on public.role_permissions for all to authenticated
  using (public.has_permission('kullanici.yonet')) with check (public.has_permission('kullanici.yonet'));

-- Supplier prices: fiyat.goruntule okur, fiyat.guncelle yazar
create policy sp_read   on public.supplier_prices for select to authenticated
  using (public.has_permission('fiyat.goruntule'));
create policy sp_write  on public.supplier_prices for all to authenticated
  using (public.has_permission('fiyat.guncelle')) with check (public.has_permission('fiyat.guncelle'));

-- FX ayarları: ayarlar.yonet yazar
create policy fx_write  on public.fx_settings for all to authenticated
  using (public.has_permission('ayarlar.yonet')) with check (public.has_permission('ayarlar.yonet'));

-- Kataloglar: ayarlar.yonet yazar
create policy cat_write on public.catalogs for all to authenticated
  using (public.has_permission('ayarlar.yonet')) with check (public.has_permission('ayarlar.yonet'));

-- Audit log: giriş yapan herkes ekleyebilir; kullanıcı yönetenler okur
create policy audit_insert on public.audit_log for insert to authenticated with check (user_id = auth.uid());
create policy audit_read   on public.audit_log for select to authenticated using (public.has_permission('kullanici.yonet'));

-- =========================================================
-- 7) Seed: varsayılan roller + izinler + tekil FX satırı
-- =========================================================
insert into public.roles (ad, aciklama) values
  ('admin', 'Tam yetki'),
  ('editor', 'Ürün/fiyat/sipariş/kargo işlemleri'),
  ('viewer', 'Yalnız görüntüleme')
on conflict (ad) do nothing;

-- admin: tüm izinler
insert into public.role_permissions (role_id, izin)
select r.id, perm from public.roles r
cross join (values
  ('urun.ekle'),('urun.duzenle'),('fiyat.goruntule'),('fiyat.guncelle'),
  ('siparis.goruntule'),('siparis.duzenle'),('kargo.gonderi'),
  ('ayarlar.yonet'),('kullanici.yonet')
) as p(perm)
where r.ad = 'admin'
on conflict do nothing;

-- editor: yönetim hariç operasyonel izinler
insert into public.role_permissions (role_id, izin)
select r.id, perm from public.roles r
cross join (values
  ('urun.ekle'),('urun.duzenle'),('fiyat.goruntule'),('fiyat.guncelle'),
  ('siparis.goruntule'),('siparis.duzenle'),('kargo.gonderi')
) as p(perm)
where r.ad = 'editor'
on conflict do nothing;

-- viewer: yalnız görüntüleme izinleri
insert into public.role_permissions (role_id, izin)
select r.id, perm from public.roles r
cross join (values ('fiyat.goruntule'),('siparis.goruntule')) as p(perm)
where r.ad = 'viewer'
on conflict do nothing;

insert into public.fx_settings (id) values (1) on conflict (id) do nothing;
