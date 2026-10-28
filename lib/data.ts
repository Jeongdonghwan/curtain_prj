// 데이터 로더 — 선정 키워드 페이지, 지역 사실, 상품. 빌드 전용.
import pagesData from '../data/site-pages.json';
import regionData from '../data/regions-sg.json';
import productData from '../data/products.json';
import aptData from '../data/dong-apts.json';
import { OPEN_WAVE, MERGE_VARIANTS } from './site';

export interface Page {
  no: number; kw: string; slug: string; word: string; region: string; level: string;
  sido: string; parent: string; wave: number; variantOf?: string;
}
export interface Facts { kw: string; name: string; homes: string; windows: string; spots: string[]; room: string }
export interface Product { id: string; name: string; short: string; kind: string; light: string; price: number; url: string; img: string }

export interface Complex { name: string; year: number | null; hh: number; hall: string; floor: number; legal: string }
export interface DongHouseholds { total: number; one: number; two: number; family: number; guOne: number; guName: string; units: string[] }
// hh는 모든 동에, 단지 칸(gu~complexes)은 K-apt에서 맞춘 동에만 있다
export interface DongApts {
  hh?: DongHouseholds;
  gu: string; legal: string[]; count: number; households: number; oldest: number | null; newest: number | null;
  since2010: number; before2000: number; hall: Record<string, number>; mixed: number; maxFloor: number; complexes: Complex[];
}

export const ALL_PAGES = pagesData.pages as Page[];
export const OPEN_PAGES = ALL_PAGES.filter((p) => p.wave <= OPEN_WAVE);
const openSet = new Set(OPEN_PAGES.map((p) => p.slug));
export const PRODUCTS = productData.products as Product[];
const FACTS = regionData.regions as Facts[];

export const pagePath = (p: Page) => `/${p.slug}/`;
export const pageEncodedPath = (p: Page) => `/${encodeURIComponent(p.slug)}/`;
export const canonicalPath = (p: Page) =>
  MERGE_VARIANTS && p.variantOf && openSet.has(p.variantOf) ? `/${encodeURIComponent(p.variantOf)}/` : pageEncodedPath(p);
export const inSitemap = (p: Page) => canonicalPath(p) === pageEncodedPath(p);

export function getPage(slug: string) {
  let k = slug;
  try { k = decodeURIComponent(slug); } catch {}
  return OPEN_PAGES.find((p) => p.slug === k);
}

// 지역 사실: 지역명 → 상위 지역 → 시도 순으로 찾는다 (강남구 → 강남, 장안구 → 수원)
const short = (n: string) => n.replace(/^(서울|경기) /, '').replace(/(구|시|군)$/, '');
export function factsOf(p: Page): Facts {
  const byKw = (k?: string) => k && FACTS.find((f) => f.kw === k || f.name === k);
  return byKw(p.region) || byKw(short(p.region)) || byKw(p.parent) || byKw(short(p.parent)) || byKw(p.sido === '서울특별시' ? '서울' : '경기')!;
}

// 동·읍면 공동주택 단지 (K-apt 단지 기본정보, scripts/build_dong_apts.py). 못 맞춘 동은 undefined
const APTS = aptData.dongs as unknown as Record<string, DongApts>;
export const aptsOf = (p: Page): DongApts | undefined => APTS[p.region];

export const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; };

// 지역 목록 (메인·지역 페이지): 시도 → 시군구 대표 페이지('○○ 커튼')
export function regionHubs() {
  const top = OPEN_PAGES.filter((p) => p.level !== '동' && p.level !== '읍면' && p.word === '커튼' && !p.variantOf);
  return ['서울특별시', '경기도'].map((sido) => ({ sido, label: sido === '서울특별시' ? '서울' : '경기', pages: top.filter((p) => p.sido === sido) }));
}

// 관련 페이지 — 열린 페이지만: 같은 지역 다른 단어 / 같은 단어 이웃 지역
export function related(p: Page) {
  const pool = OPEN_PAGES.filter((x) => x.slug !== p.slug && !x.variantOf);
  const rot = <T,>(arr: T[], n: number) => { if (!arr.length) return arr; const k = hash(p.slug) % arr.length; return [...arr.slice(k), ...arr.slice(0, k)].slice(0, n); };
  return {
    samePlace: pool.filter((x) => x.region === p.region).slice(0, 14),
    sameWord: rot(pool.filter((x) => x.word === p.word && x.parent === p.parent && x.region !== p.region), 10),
    wider: rot(pool.filter((x) => x.word === p.word && x.sido === p.sido && x.level !== '동' && x.level !== '읍면' && x.region !== p.region), 8),
  };
}
