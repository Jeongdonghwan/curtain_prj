// 열린 페이지의 title·h1·description 길이·중복 점검: OPEN_WAVE=38 npx tsx scripts/meta_check.ts
import { OPEN_PAGES } from '../lib/data';
import { compose } from '../lib/compose';
import { composeAxis, isAxisPage } from '../lib/axes';
import { BRAND } from '../lib/site';

const T = new Map<string, number>(), D = new Map<string, number>();
let n = 0, tLong = 0, headLong = 0, noSub = 0, dBad = 0, notH1 = 0, punct = 0;
for (const p of OPEN_PAGES) {
  const c: any = isAxisPage(p) ? composeAxis(p) : compose(p);
  n++;
  T.set(c.title, (T.get(c.title) || 0) + 1); D.set(c.description, (D.get(c.description) || 0) + 1);
  const head = c.title.replace(` | ${BRAND}`, '');
  if (c.title.length > 60) tLong++;
  if (head.length > 40) headLong++;
  if (head === p.kw) noSub++;
  if (head !== p.kw && head !== `${p.kw} ${c.h1sub}`) notH1++;
  if (c.description.length < 45 || c.description.length > 80) dBad++;
  if (/[.,] ?[.,]|\s{2}/.test(c.description)) punct++;
}
const dup = (m: Map<string, number>) => [...m.values()].filter((v) => v > 1).length;
console.log(JSON.stringify({ pages: n, titleDup: dup(T), titleOver60: tLong, headOver40: headLong, titleWithoutSub: noSub, titleNotH1: notH1, descOutOfRange: dBad, descDup: dup(D), descPunct: punct }));
if (dup(T) || tLong || headLong || notH1 || dBad || dup(D) || punct) process.exit(1);
