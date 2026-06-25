import { ModulePlaceholder } from '@renderer/components/ui/ModulePlaceholder'

export function OrdersScreen(): JSX.Element {
  return (
    <ModulePlaceholder
      baslik="Siparişler"
      ikon="🧾"
      ozet="Siparişleri listeleme, filtreleme ve düzenleme — Ticimax sipariş servisi"
      planlananlar={[
        'Sipariş listeleme + filtreler (durum, ödeme, tarih, no, müşteri)',
        'Sipariş detay görünümü (ürünler, ödemeler, adresler)',
        'Durum güncelleme (SetSiparisDurum) ve müşteri bilgilendirme',
        'Fatura no atama (SetFaturaNo) ve satır bazlı durum',
        'Kargo modülüne köprü: siparişten gönderi oluşturma'
      ]}
    />
  )
}
