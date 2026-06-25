/**
 * UPS adres kod tablolarını (xls) → resources/data JSON'a çevirir.
 * Tek seferlik/güncellemede çalıştırılır:
 *   node scripts/build-ups-seed.mjs ["<UPS SMART ENTEGRASYON klasörü>"]
 * Varsayılan kaynak: bilinen UPS klasörü. Çıktı repoya gömülür (extraResources).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import xlsx from 'xlsx'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'resources', 'data')

const SRC =
  process.argv[2] ||
  'C:\\Users\\Burak\\Desktop\\UPS KARGO\\UPS SMART ENTEGRASYON\\Domestic Shipping API\\Domestic Shipping API'

function readSheet(file) {
  const wb = xlsx.readFile(file)
  return xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' })
}

function num(v) {
  const n = Number(String(v).trim())
  return Number.isFinite(n) ? n : null
}

function pick(row, keys) {
  for (const k of Object.keys(row)) {
    const norm = k.toLowerCase().replace(/[\s_]/g, '')
    if (keys.some((want) => norm.includes(want))) return row[k]
  }
  return ''
}

mkdirSync(OUT_DIR, { recursive: true })

// --- Areas (UmoCityAreaCode.xls) ---
const areaRows = readSheet(join(SRC, 'UmoCityAreaCode.xls'))
const areas = areaRows
  .map((r) => ({
    areaCode: num(pick(r, ['areacode'])),
    cityCode: num(pick(r, ['citycode'])),
    nameTr: String(pick(r, ['areadescriptiontr', 'descriptiontr', 'tr'])).trim(),
    linkedAreaCode: num(pick(r, ['linkedareacode']))
  }))
  .filter((a) => a.areaCode != null && a.cityCode != null)

// --- Districts (Districts.xlsx) ---
const distRows = readSheet(join(SRC, 'Districts.xlsx'))
const districts = distRows
  .map((r) => ({
    cityId: num(pick(r, ['cityid'])),
    cityName: String(pick(r, ['cityname'])).trim(),
    districtId: num(pick(r, ['districtid'])),
    districtName: String(pick(r, ['districtname'])).trim()
  }))
  .filter((d) => d.cityId != null && d.districtName)

writeFileSync(join(OUT_DIR, 'ups-areas.json'), JSON.stringify(areas))
writeFileSync(join(OUT_DIR, 'ups-districts.json'), JSON.stringify(districts))

console.log(`ups-areas.json: ${areas.length} kayıt`)
console.log(`ups-districts.json: ${districts.length} kayıt`)
console.log('Örnek area:', JSON.stringify(areas[0]))
console.log('Örnek district:', JSON.stringify(districts[0]))
