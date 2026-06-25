import { ModulePlaceholder } from '@renderer/components/ui/ModulePlaceholder'

export function ProductsScreen(): JSX.Element {
  return (
    <ModulePlaceholder
      baslik="Ürünler"
      ikon="📦"
      ozet="Uygulama içinden ürün ekleme — görsel yükleme ve sabit formatlı açıklama tasarımı"
      planlananlar={[
        'Ürün ekleme formu (kart + varyasyon) ve Ticimax SaveUrun ile kayıt',
        'Sabit açıklama şablonu: Ürün Özellikleri (maddeli) + Teknik Özellikler (tablo)',
        'Görsel yükleme: dosya seç → Supabase Storage → Ticimax Resimler',
        'Kategori / Marka / Tedarikçi / Para Birimi seçicileri (Ticimax select)',
        'Marka turuncu paletinde otomatik inline-CSS HTML üretimi',
        'KDV oranı, fiyat ve stok alanları (varyasyon bazlı)'
      ]}
    />
  )
}
