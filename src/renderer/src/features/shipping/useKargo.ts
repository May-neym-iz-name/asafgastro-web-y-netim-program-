import { useEffect, useState } from 'react'

export interface Sehir {
  cityId: number
  cityName: string
}
export interface Ilce {
  districtId: number
  districtName: string
}
export interface Area {
  areaCode: number
  nameTr: string
}

/** İl listesi (bir kez yüklenir). */
export function useSehirler(): Sehir[] {
  const [sehirler, setSehirler] = useState<Sehir[]>([])
  useEffect(() => {
    window.api.ups.listCities().then((r) => {
      if (r.ok) setSehirler((r.data ?? []) as Sehir[])
    })
  }, [])
  return sehirler
}

/** Seçili ile ait ilçeler + area'ları yükler. */
export function useIlceArea(cityId: number | null): { ilceler: Ilce[]; areas: Area[] } {
  const [ilceler, setIlceler] = useState<Ilce[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  useEffect(() => {
    if (cityId == null) {
      setIlceler([])
      setAreas([])
      return
    }
    let iptal = false
    window.api.ups
      .listDistricts(cityId)
      .then((r) => {
        if (!iptal && r.ok) setIlceler((r.data ?? []) as Ilce[])
      })
      .catch(() => {})
    // CityCode = plaka kodu ≈ cityId (TR plaka) — area listesi
    window.api.ups
      .listAreas(cityId)
      .then((r) => {
        if (!iptal && r.ok) setAreas((r.data ?? []) as Area[])
      })
      .catch(() => {})
    return () => {
      iptal = true
    }
  }, [cityId])
  return { ilceler, areas }
}
