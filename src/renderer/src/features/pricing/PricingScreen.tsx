import { ModulePlaceholder } from '@renderer/components/ui/ModulePlaceholder'

export function PricingScreen(): JSX.Element {
  return (
    <ModulePlaceholder
      baslik="Fiyat Güncelleme"
      ikon="💰"
      ozet="Alış-iskonto, KDV dahil/hariç, kâr ve toplu fiyat yönetimi — Ticimax ile tam entegre"
      planlananlar={[
        'Tedarikçi liste fiyatı + iskonto → net alış (toplu iskonto uygulama)',
        'KDV hariç ve dahil satış alanları (site moduna göre dönüşüm)',
        'Kâr oranı (%) ve kâr tutarı; indirimli fiyatı son satış kabul etme',
        'Alış/satış için ayrı döviz kaynağı (TCMB / DenizBank) ve para birimi',
        'Seçili ürünlere toplu kâr % yazma ve fiyat düzenleme',
        'Kritik kâr marjı filtresi (≤ %x altındaki ürünler)',
        'Katalog PDF görüntüleyici (sağ/sol/üst/alt panel, ekle/sil)',
        'Ürün kart aktifliği değiştirme',
        'Çift onaylı kaydetme (uyarı + “Emin misin? :)”) → ancak sonra Ticimax',
        'Tedarikçi liste fiyatı + iskonto Supabase senkron + audit log'
      ]}
    />
  )
}
