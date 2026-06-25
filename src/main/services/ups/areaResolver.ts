import { readFileSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

/**
 * UPS il/ilçe/area kod çözümleyici. Seed JSON'ları (resources/data) yükler.
 * CityCode (plaka) gönderici/alıcı için zorunlu; AreaCode mahalle/semt kodu.
 * Alias area'larda LinkedAreaCode takip edilir.
 */

interface AreaRow {
  areaCode: number
  cityCode: number
  nameTr: string
  linkedAreaCode: number | null
}
interface DistrictRow {
  cityId: number
  cityName: string
  districtId: number
  districtName: string
}

let areas: AreaRow[] | null = null
let districts: DistrictRow[] | null = null

function dataDir(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'data')
    : join(app.getAppPath(), 'resources', 'data')
}

function load(): void {
  if (areas && districts) return
  const dir = dataDir()
  areas = JSON.parse(readFileSync(join(dir, 'ups-areas.json'), 'utf-8')) as AreaRow[]
  districts = JSON.parse(readFileSync(join(dir, 'ups-districts.json'), 'utf-8')) as DistrictRow[]
}

function normalize(s: string): string {
  return s
    .toLocaleUpperCase('tr-TR')
    .replace(/İ/g, 'I')
    .replace(/[^A-Z0-9]/g, '')
}

/** İl listesi (benzersiz). */
export function listCities(): { cityId: number; cityName: string }[] {
  load()
  const seen = new Map<number, string>()
  for (const d of districts!) if (!seen.has(d.cityId)) seen.set(d.cityId, d.cityName)
  return [...seen.entries()].map(([cityId, cityName]) => ({ cityId, cityName }))
}

/** Bir ile ait ilçeler. */
export function listDistricts(cityId: number): DistrictRow[] {
  load()
  return districts!.filter((d) => d.cityId === cityId)
}

/** Bir ile ait UPS area listesi (alias'lar LinkedAreaCode'a indirgenir). */
export function listAreas(cityCode: number): { areaCode: number; nameTr: string }[] {
  load()
  return areas!
    .filter((a) => a.cityCode === cityCode)
    .map((a) => ({ areaCode: a.linkedAreaCode ?? a.areaCode, nameTr: a.nameTr }))
}

/**
 * İl + serbest semt/mahalle metninden CityCode + AreaCode çözer.
 * Tam eşleşme, sonra "içeren" eşleşme dener. Bulunamazsa null.
 */
export function resolveArea(
  cityCode: number,
  query: string
): { cityCode: number; areaCode: number; nameTr: string } | null {
  load()
  const q = normalize(query)
  const inCity = areas!.filter((a) => a.cityCode === cityCode)
  const exact = inCity.find((a) => normalize(a.nameTr) === q)
  const hit = exact ?? inCity.find((a) => normalize(a.nameTr).includes(q) && q.length >= 3)
  if (!hit) return null
  return { cityCode, areaCode: hit.linkedAreaCode ?? hit.areaCode, nameTr: hit.nameTr }
}
