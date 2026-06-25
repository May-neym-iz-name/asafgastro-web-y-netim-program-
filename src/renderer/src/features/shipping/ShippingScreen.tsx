import { ModulePlaceholder } from '@renderer/components/ui/ModulePlaceholder'

export function ShippingScreen(): JSX.Element {
  return (
    <ModulePlaceholder
      baslik="Kargo"
      ikon="🚚"
      ozet="UPS Kargo gönderi oluşturma, etiket ve takip — siparişlerle entegre"
      planlananlar={[
        'Siparişten gönderi oluşturma (CreateShipment_Type3)',
        'İl/ilçe → CityCode + AreaCode otomatik çözümleme',
        'Takip numarası + etiket (barkod PNG) üretimi',
        'Ticimax’e geri yazma: kargo takip no + “Kargoya verildi”',
        'Gönderi takip ekranı (durum/olay zaman çizelgesi) ve iptal'
      ]}
    />
  )
}
