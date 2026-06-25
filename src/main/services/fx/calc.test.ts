import { describe, it, expect } from 'vitest'
import {
  kdvHaricToDahil,
  kdvDahilToHaric,
  netAlis,
  toTRY,
  convert,
  kar,
  karOranindanSatis,
  round
} from './calc'

describe('KDV hesabı', () => {
  it('hariç → dahil (%20)', () => {
    expect(kdvHaricToDahil(100, 20)).toBe(120)
  })
  it('dahil → hariç (%20)', () => {
    expect(kdvDahilToHaric(120, 20)).toBe(100)
  })
  it('hariç→dahil→hariç round-trip (%10)', () => {
    const haric = 250
    expect(kdvDahilToHaric(kdvHaricToDahil(haric, 10), 10)).toBe(haric)
  })
  it('%1 KDV', () => {
    expect(kdvHaricToDahil(1000, 1)).toBe(1010)
  })
})

describe('Net alış (iskonto)', () => {
  it('1000 liste, %55 iskonto → 450', () => {
    expect(netAlis(1000, 55)).toBe(450)
  })
  it('%0 iskonto liste fiyatını korur', () => {
    expect(netAlis(750, 0)).toBe(750)
  })
})

describe('Döviz çevirme', () => {
  it('100 EUR @ 52.76 → 5276 TRY', () => {
    expect(toTRY(100, 52.76)).toBe(5276)
  })
  it('EUR→USD (kur bazlı)', () => {
    // 100 EUR (52.76) → USD (46.49) ≈ 113.49
    expect(convert(100, 52.76, 46.49)).toBe(113.49)
  })
  it('hedef kur 0 ise 0 döner (bölme koruması)', () => {
    expect(convert(100, 52.76, 0)).toBe(0)
  })
})

describe('Kâr hesabı', () => {
  it('satış 150, alış 100 → kâr 50 / %50', () => {
    expect(kar(150, 100)).toEqual({ karTutari: 50, karOrani: 50 })
  })
  it('alış 0 → kâr oranı 0 (bölme koruması)', () => {
    expect(kar(150, 0)).toEqual({ karTutari: 150, karOrani: 0 })
  })
  it('zarar negatif kâr verir', () => {
    expect(kar(80, 100)).toEqual({ karTutari: -20, karOrani: -20 })
  })
})

describe('Kâr oranından satış', () => {
  it('alış 100, hedef %35 → 135', () => {
    expect(karOranindanSatis(100, 35)).toBe(135)
  })
})

describe('round', () => {
  it('2 ondalık yuvarlar', () => {
    expect(round(46.40991, 2)).toBe(46.41)
  })
})
